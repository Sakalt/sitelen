import * as React from 'react';
import * as OTM from '../app/OTM/types';
import uniqueId = require('lodash/uniqueId');
import cloneDeep = require('lodash/cloneDeep');
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './WordEditor.scss';
import * as Page from './Page';

interface Props {
  word: OTM.Word;
  onEdit: (word: OTM.Word) => void;
  onCancel: () => void;
  onRemove: () => void;
  onSelect: () => Promise<OTM.Entry | null>;
}

type Keyed<T> = [string, T];

interface State {
  entryForm: string;
  translations: Keyed<{ title: string, forms: string }>[];
  tags: Keyed<OTM.Tag>[];
  contents: Keyed<OTM.Content>[];
  variations: Keyed<OTM.Variation>[];
  relations: Keyed<{ title: string, entry: OTM.Entry | null }>[];
}

// フォーカスが嫌なので各ボタンは div にした
const PropEditor = <T extends {}>(props: {
  title: string,
  items: Keyed<T>[],
  defaultItem: T;
  onChange: (items: Keyed<T>[]) => void;
  children: (item: T, update: (item: T) => void) => React.ReactNode,
}) => {
  const updateFactory = (key: string) => (item: T) => {
    props.onChange(props.items.map(entry => entry[0] === key ? [entry[0], item] as Keyed<T> : entry));
  };
  return (
    <div className="prop-editor">
      <div className="prop-title">{props.title}</div>
      <div className="prop-body">
        {props.items.map(([key, item], i) => [
          i !== 0 && (
            <div
              key={`swapper-${i}`}
              className="item-swapper"
              onClick={() => props.onChange([...props.items.slice(0, i - 1), props.items[i], props.items[i - 1], ...props.items.slice(i + 1)])}
            >
              <FontAwesomeIcon icon="long-arrow-alt-up" />
              <FontAwesomeIcon icon="long-arrow-alt-down" />
            </div>
          ),
          <div key={key} className="prop-item">
            {props.children(item, updateFactory(key))}
            <div
              className="item-remover"
              onClick={() => confirm("項目を削除します。") && props.onChange(props.items.filter(entry => entry[0] !== key))}
            >
              <FontAwesomeIcon icon="trash-alt" />
            </div>
          </div>
        ])}
        <div
          className="item-adder"
          onClick={() => props.onChange([...props.items, [uniqueId(), cloneDeep(props.defaultItem)]])}
        >
          <FontAwesomeIcon icon="plus" />
        </div>
      </div>
    </div>
  );
};

const withKey = <T extends {}>(item: T) => [uniqueId(), item] as Keyed<T>;
const withoutKey = <T extends {}>(entry: Keyed<T>) => entry[1];

export default class WordEditor extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      entryForm: props.word.entry.form,
      translations: props.word.translations.map(translation => ({
        title: translation.title,
        forms: translation.forms.join("\n"),
      })).map(withKey),
      tags: props.word.tags.map(withKey),
      contents: props.word.contents.map(withKey),
      variations: props.word.variations.map(withKey),
      relations: props.word.relations.map(withKey),
    };
    this.handleEdit = this.handleEdit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  buildWord(): OTM.Word {
    return {
      entry: {
        id: this.props.word.entry.id,
        form: this.state.entryForm,
      },
      translations:
        this.state.translations.map(withoutKey).map(translation => {
          return {
            title: translation.title,
            forms: translation.forms.split("\n").filter(form => form.trim()),
          };
        }),
      tags: this.state.tags.map(withoutKey),
      contents: this.state.contents.map(withoutKey),
      variations: this.state.variations.map(withoutKey),
      relations:
        this.state.relations.map(withoutKey)
          .filter(function (relation): relation is OTM.Relation { return relation.entry !== null; }),
    };
  }

  handleEdit() {
    const word = this.buildWord();
    const changed = JSON.stringify(this.props.word) !== JSON.stringify(word);
    if (changed) {
      alert("変更しました。");
      this.props.onEdit(word);
    }
  }

  handleCancel() {
    const word = this.buildWord();
    const changed = JSON.stringify(this.props.word) !== JSON.stringify(word);
    if (changed) {
      if (confirm("閉じると変更は破棄されます。閉じますか？")) {
        this.props.onCancel();
      }
    }
  }

  render() {
    return (
      <Page.Item>
        <Page.Header>
          <Page.Button onClick={this.handleCancel}>
            <FontAwesomeIcon icon="times" />
          </Page.Button>
          <Page.Title>単語の編集</Page.Title>
        </Page.Header>
        <Page.Body>
          <div className="word-editor-hoge">
            <div className="prop-editor">
              <div className="prop-title">単語</div>
              <div className="prop-body">
                <input
                  value={this.state.entryForm}
                  onChange={event => this.setState({ entryForm: event.target.value })}
                />
              </div>
            </div>
            <PropEditor
              title="訳語"
              items={this.state.translations}
              defaultItem={{ title: "", forms: "" }}
              onChange={translations => this.setState({ translations })}
            >
              {(translation, update) => <>
                <input
                  value={translation.title}
                  onChange={e => update({ ...translation, title: e.target.value })}
                />
                <textarea
                  value={translation.forms}
                  onChange={e => update({ ...translation, forms: e.target.value })}
                />
              </>}
            </PropEditor>
            <PropEditor
              title="タグ"
              items={this.state.tags}
              defaultItem={""}
              onChange={tags => this.setState({ tags })}
            >
              {(tag, update) => <>
                <input
                  value={tag}
                  onChange={e => update(e.target.value)}
                />
              </>}
            </PropEditor>
            <PropEditor
              title="内容"
              items={this.state.contents}
              defaultItem={{ title: "", text: "" }}
              onChange={contents => this.setState({ contents })}
            >
              {(content, update) => <>
                <input
                  value={content.title}
                  onChange={e => update({ ...content, title: e.target.value })}
                />
                <textarea
                  value={content.text}
                  onChange={e => update({ ...content, text: e.target.value })}
                />
              </>}
            </PropEditor>
            <PropEditor
              title="変化形"
              items={this.state.variations}
              defaultItem={{ title: "", form: "" }}
              onChange={variations => this.setState({ variations })}
            >
              {(variation, update) => <>
                <input
                  value={variation.title}
                  onChange={e => update({ ...variation, title: e.target.value })}
                />
                <input
                  value={variation.form}
                  onChange={e => update({ ...variation, form: e.target.value })}
                />
              </>}
            </PropEditor>
            <PropEditor
              title="関連語"
              items={this.state.relations}
              defaultItem={{ title: "", entry: null }}
              onChange={relations => this.setState({ relations })}
            >
              {(variation, update) => <>
                <input
                  value={variation.title}
                  onChange={e => update({ ...variation, title: e.target.value })}
                />
                <input
                  readOnly
                  defaultValue={variation.entry ? variation.entry.form : ""}
                  onClick={async () => update({ ...variation, entry: await this.props.onSelect() })}
                />
              </>}
            </PropEditor>
          </div>
        </Page.Body>
      </Page.Item>
    );
  }
}
