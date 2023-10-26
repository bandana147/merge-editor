import { useEffect, useState } from 'react';
import { md2html } from './editor.js';
import DocView from './components/DocView.js';
import Header from './components/Header.js';
import './App.css';

function App() {
  const [collapsed, setCollasped] = useState(false)
  const [currentScale, setCurrentScale] = useState(1);
  const [hast, setHast] = useState({});
  const [searchResult, setSearchResult] = useState([]);
  const [blockTypes, setBlockTypes] = useState([]);
  const [noResultFound, setNoResultFound] = useState(false);

  useEffect(() => {
    async function getData() {
      const data = await md2html("files/langstore", "files/region");
      setHast(data.hast);
      const blocks = data.hast.children.reduce((acc, curr) => {
        if (curr.child.tagName === 'table') {
          const block = curr.child.children?.[0]?.children?.[0]?.children?.[0]?.children?.[0].value;
          const blockName = block.split(' (');
          acc.push(blockName[0]);
        }
        return acc;
      }, []);
      const uniqueBlocks = [...new Set(blocks)];
      setBlockTypes(uniqueBlocks)
    }
    getData();
  }, []);

  function onToggleCollapse() {
    setCollasped(!collapsed);
  }

  function scaleDown() {
    const newScale = currentScale - currentScale / 10;
    setCurrentScale(newScale);
    document.querySelector('#doc').style.transform = `scale(${newScale})`;
  }

  function scaleUp() {
    const newScale = currentScale + currentScale / 10;
    setCurrentScale(newScale);
    document.querySelector('#doc').style.transform = `scale(${newScale})`;
  }

  function onSave() {
    //convert to doc here
    console.log(blocks);
  }

  function setBlocks(blocks) {
    setHast({ ...hast, children: blocks });
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
    <>
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
      />
      <div id="doc" className='main-wrapper'>
        <div className={`block-container ${collapsed ? 'collapsed' : ''}`}>
          <DocView blocks={node} setBlocks={setBlocks} noResultFound={noResultFound}/>
        </div>
        <div className="collapsed preview-container">
          <DocView blocks={node} setBlocks={setBlocks} isPreview={true} />
        </div>
      </div>
    </>
  );
}

export default App;
