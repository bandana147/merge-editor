import { useEffect, useState } from 'react';
import { md2html } from './editor.js';
import DocView from './components/DocView.js';
import Header from './components/Header.js';
import { mdast2docx } from './libs/mdast2docx.bundle.js';
import { defaultHandlers, toMdast } from 'hast-util-to-mdast';
import { defaultTheme, Provider } from '@adobe/react-spectrum';

import hast_table_handle from './handlers/hast-table-handler.js';
import hast_table_cell_handler from './handlers/hast-table-cell-handler.js';

import './App.css';

function findBlockName(obj) {
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

function App({ onSelectTheme }) {
  const [collapsed, setCollasped] = useState(false)
  const [currentScale, setCurrentScale] = useState(1);
  const [hast, setHast] = useState({});
  const [searchResult, setSearchResult] = useState([]);
  const [blockTypes, setBlockTypes] = useState([]);
  const [noResultFound, setNoResultFound] = useState(false);
  const [theme, setTheme] = useState(prefersDarkMode ? 'dark' : 'light');

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

  function onToggleCollapse() {
    setCollasped(!collapsed);
  }

  function scaleDown() {
    const newScale = currentScale - currentScale / 10;
    setCurrentScale(newScale);
    document.querySelector('#block').style.transform = `scale(${newScale})`;
  }

  function scaleUp() {
    const newScale = currentScale + currentScale / 10;
    setCurrentScale(newScale);
    document.querySelector('#block').style.transform = `scale(${newScale})`;
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
    const children = hast.children.filter(child => child.hash.type !== 'deleted' ).map(node => node.child);

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
    // const { mdast2docx } = await import(`${window.location.origin}/tools/loc/helix/mdast2docx.bundle.js`);
    const blob = await mdast2docx(mdast);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  function setBlocks(blocks) {
    setHast({ ...hast, children: blocks });
  }

  function onSelectTheme(val) {
    setTheme(val);
  }

  let node = [];
  if (searchResult.length > 0) {
    searchResult.forEach(id => {
      const curItem = hast.children.find(n => n.uuid === id);
      node.push(curItem)
    })
  } else {
    node = hast.children || [];
  }

  return (
    <Provider theme={defaultTheme} colorScheme={theme}>
      <Header
        blockTypes={blockTypes}
        setSearchResult={setSearchResult}
        scaleDown={scaleDown}
        scaleUp={scaleUp}
        onToggleCollapse={onToggleCollapse}
        collapsed={collapsed}
        allBlocks={hast.children}
        setNoResultFound={setNoResultFound}
        onSave={onSave}
        onSelectTheme={onSelectTheme}
      />
      <div id="doc" className={`${theme} main-wrapper`}>
        <div id="block" className={`block-container ${collapsed ? 'collapsed' : ''}`}>
          <DocView blocks={node} setBlocks={setBlocks} noResultFound={noResultFound} />
        </div>
        <div className="collapsed preview-container">
          <DocView blocks={node} setBlocks={setBlocks} noResultFound={noResultFound} isPreview={true} />
        </div>
      </div>
    </Provider>
  );
}

export default App;
