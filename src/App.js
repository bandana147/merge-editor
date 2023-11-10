import { useEffect, useState } from 'react';
import { md2html, getCustomHast } from './editor.js';
import DocView from './components/DocView.js';
import Header from './components/Header.js';
import { mdast2docx } from './libs/mdast2docx.bundle.js';
import { defaultHandlers, toMdast } from 'hast-util-to-mdast';
import { defaultTheme, Provider } from '@adobe/react-spectrum';

import hast_table_handle from './handlers/hast-table-handler.js';
import hast_table_cell_handler from './handlers/hast-table-cell-handler.js';

import './App.css';
import ScreenSize from './components/ScreenSize.js';

export function findBlockName(obj) {
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return findBlockName(obj[0]);
    }
  } else if (typeof obj === 'object') {
    if (obj.hasOwnProperty('value')) {
      return obj.value;
    }
    for (const key in obj) {
      if (typeof obj[key] === 'object' || Array.isArray(obj[key])) {
        const result = findBlockName(obj[key]);
        if (result) {
          return result;
        }
      }
    }
  }
  return '';
}

const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

function App() {
  const [collapsed, setCollasped] = useState(false)
  const [hast, setHast] = useState({});
  const [searchResult, setSearchResult] = useState([]);
  const [blockTypes, setBlockTypes] = useState([]);
  const [noResultFound, setNoResultFound] = useState(false);
  const [theme, setTheme] = useState(prefersDarkMode ? 'dark' : 'light');
  const [viewType, setViewType] = useState('diffV1');
  const [hideAcceptRejectAll, setHideAcceptRejectAll] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  useEffect(() => {
    async function getData() {
      const hast = await md2html("files/langstore", "files/region");
      setHast(hast);
      const blocks = hast.children.reduce((acc, curr) => {
        if (curr.child.tagName === 'table') {
          const block = findBlockName(curr);
          const blockName = block.split(' (');
          acc.push(blockName[0]);
        }
        return acc;
      }, []);
      const uniqueBlocks = [...new Set(blocks)];
      setBlockTypes(uniqueBlocks);
    }
    getData();
  }, []);

  function removeNode(id) {
    const newBlocks = hast.children.filter(child => child.uuid !== id);
    setBlocks(newBlocks);
    if (searchResult.length > 0) {
      const newSearchRes = searchResult.filter(child => child.uuid !== id);
      setSearchResult(newSearchRes);
    }
  }

  function addNode(id, index) {
    const elemIdx = hast.children.findIndex(item => item.uuid === id);
    const newBlocks = hast.children.slice();
    delete newBlocks[elemIdx]?.hash?.type;
    setBlocks(newBlocks);
    if (searchResult.length > 0) {
      const newSearchRes = searchResult.slice();
      delete newSearchRes[index]?.hash?.type;
      setSearchResult(newSearchRes);
    }
  }

  function onUpdateList(evt) {
    const newBlocks = hast.children.slice();
    const currentElem = newBlocks[evt.oldIndex];
    newBlocks[evt.oldIndex] = newBlocks[evt.newIndex];
    newBlocks[evt.newIndex] = currentElem;
    setBlocks(newBlocks);
  }

  function setSearchBlocks(res) {
    const searchResults = []
    res.forEach(id => {
      const curItem = hast.children.find(n => n.uuid === id);
      searchResults.push(curItem)
    });
    setSearchResult(searchResults);
    setHideAcceptRejectAll(true);
  }

  function onToggleCollapse() {
    setCollasped(!collapsed);
  }

  function formatHandler(type) {
    return (state, node) => {
      const result = { type, children: state.all(node) };
      state.patch(node, result);
      return result;
    };
  }

  function mdHandler(mdasts) {
    return (h, node) => {
      const { idx } = node.properties;
      return mdasts[idx];
    };
  }

  async function onSave() {
    const children = hast.children.filter(child => child.hash.type !== 'deleted').map(node => node.child);

    const mdast = toMdast({ ...hast, children }, {
      handlers: {
        ...defaultHandlers,
        u: formatHandler('underline'),
        sub: formatHandler('subScript'),
        sup: formatHandler('superScript'),
        table: hast_table_handle,
        markdown: mdHandler([]),
        th: hast_table_cell_handler,
        td: hast_table_cell_handler,
      }
    });
    const blob = await mdast2docx(mdast);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function setBlocks(blocks) {
    setHast({ ...hast, children: blocks });
    setHideAcceptRejectAll(true);
  }

  function onSelectTheme(val) {
    setTheme(val);
  }

  function onChangeRange(val) {
    const newBlocks = hast.children.slice(val.start - 1, val.end - 1);
    setSearchResult(newBlocks);
  }

  function updateMerge(mergeType) {
    const children = hast.children.reduce((acc, curr) => {
      if (curr.hash.type) {
        if (curr.hash.type === mergeType) {
          delete curr.hash.type;
          acc.push(curr);
        }
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    setBlocks(children);
    setHideAcceptRejectAll(true);
  }

  function onSelectViewType(val) {
    if (['diffV2', 'diffGroup'].includes(val)) return;
    const blocks = getCustomHast(val)
    setViewType(val);
    setHast(blocks);
  }

  function getCurrBlocks() {
    let node = [];
    if (searchResult.length > 0) {
      node = searchResult;
    } else {
      node = hast.children || [];
    }
    return node;
  }

  const node = getCurrBlocks();
  return (
    <Provider theme={defaultTheme} colorScheme={theme}>
      <Header
        theme={theme}
        onSave={onSave}
        viewType={viewType}
        collapsed={collapsed}
        blockTypes={blockTypes}
        blocks={hast.children}
        searchResult={node}
        setSearchResult={setSearchBlocks}
        onToggleCollapse={onToggleCollapse}
        setNoResultFound={setNoResultFound}
        onSelectTheme={onSelectTheme}
        onSelectViewType={onSelectViewType}
        onChangeRange={onChangeRange}
      />
      <div id="doc" className={`${theme} main-wrapper`}>
        <div className='doc-container'>
          <div id="block" className={`block-container ${collapsed ? 'collapsed' : ''}`}>
            <DocView
              blocks={node}
              viewType={viewType}
              updateMerge={updateMerge}
              noResultFound={noResultFound}
              onUpdateList={onUpdateList}
              removeNode={removeNode}
              addNode={addNode}
              hideAcceptRejectAll={hideAcceptRejectAll}
            />
          </div>
        </div>
        <div className="collapsed preview-container">
          <DocView hideAcceptRejectAll={true} blocks={node} noResultFound={noResultFound} onUpdateList={onUpdateList} isPreview={true} />
        </div>
      </div>
      <ScreenSize
        theme={theme}
      />
    </Provider>
  );
}

export default App;
