import { useState } from 'react';
import { SearchField, Picker, Item, ActionButton, RangeSlider, TagGroup } from '@adobe/react-spectrum';
import Maximize from '@spectrum-icons/workflow/Maximize';
import Minimize from '@spectrum-icons/workflow/Minimize';
import { findBlockName } from '../App.js';

function Header({
  blocks = [],
  setNoResultFound,
  blockTypes,
  collapsed,
  setSearchResult,
  onToggleCollapse,
  onSave,
  onSelectTheme,
  theme,
  onChangeRange,
  onSelectViewType,
  viewType,
  searchResult,
}) {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  function searchWordInAST(ast, targetWord, foundNodes, parentId = null) {
    for (const node of ast) {
      if (node.type === 'text') {
        // If the node is a text node, check for the target word
        if ((node.value).toLowerCase().includes(targetWord.toLowerCase())) {
          !foundNodes.includes(parentId) && foundNodes.push(parentId);
        }
      } else if (node.type === 'element' && node.children) {
        // If the node is an element with children, recursively search the children
        searchWordInAST(node.children, targetWord, foundNodes, parentId);
      } else if (node.child) {
        searchWordInAST(node.child.children, targetWord, foundNodes, node.uuid);
      }
    }
  }

  function filterBlockInAST(blockNodes, selectedKeys) {
    const blockNames = selectedKeys.map(item=> item.key);
    const miloBlocks = blockNodes.filter(block => {
      return block.child.tagName === 'table';
    });
    const foundNodes = miloBlocks.reduce((acc, curr) => {
      const block = findBlockName(curr);
      const blockName = block.split(' (');
      if (blockNames.includes(blockName[0])) {
        acc.push(curr.uuid);
      }
      return acc;
    }, []);

    return foundNodes;
  }

  function clearFilter() {
    if (!searchTerm) {
      const all = blocks.map(child => child.uuid);
      setSearchResult(all);
    } else {
      onChangeSearch(searchTerm, true);
    }
  }

  function onClearSearch() {
    if (selectedBlocks.length > 0 ) {
      const foundNodes = filterBlockInAST(blocks, selectedBlocks);
      setNewBlocks(foundNodes);
    } else {
      const all = blocks.map(child => child.uuid);
      setSearchResult(all);
    }
  }

  function onChangeSearch(searchKeyword, searchFromAll) {
    let blockToSearchFrom = (searchFromAll || selectedBlocks.length <= 0) ? blocks : searchResult;
    setSearchTerm(searchKeyword);
    if (searchKeyword.trim().length <= 0) {
      onClearSearch();
    } else {
      const foundNodes = [];
      searchWordInAST(blockToSearchFrom, searchKeyword, foundNodes);
      setNewBlocks(foundNodes);
    }
  }

  function onSelectBlock(blockName) {
    const newSelectedBlocks = selectedBlocks.slice();
    newSelectedBlocks.push({ key: blockName, label: blockName });
    setSelectedBlocks(newSelectedBlocks);
    const blockToSearchFrom = !searchTerm ? blocks : searchResult;
    const foundNodes = filterBlockInAST(blockToSearchFrom, newSelectedBlocks);
    setNewBlocks(foundNodes);
  }

  function setNewBlocks(foundNodes) {
    if (foundNodes.length > 0) {
      setNoResultFound(false);
      setSearchResult(foundNodes);
    } else {
      setNoResultFound(true);
    }
  }

  function onRemove(items) {
    const itemToRemove = Array.from(items)[0];
    const elemIdx = selectedBlocks.findIndex(item => item.key === itemToRemove);
    const newSelectedBlocks = selectedBlocks.slice();
    newSelectedBlocks.splice(elemIdx, 1);
    if (newSelectedBlocks.length <= 0) {
      clearFilter();
    } else {
      const foundNodes = filterBlockInAST(searchResult, newSelectedBlocks);
      setNewBlocks(foundNodes);
    }
    
    setSelectedBlocks(newSelectedBlocks);
  }

  function renderTags() {
    if (selectedBlocks.length <= 0) return null;
    return <div className='tags-wrapper'>
      <TagGroup
        items={selectedBlocks}
        onRemove={onRemove}
        aria-label="Removable TagGroup example">
        {item => <Item>{item.label}</Item>}
      </TagGroup>
    </div>
  }

  return (
    <div id="topnav" className={theme}>
      <div>Document.docx</div>
      {renderTags()}
      <div className="nav-wrapper">
        <RangeSlider
          key={`range-${blocks.length}}`}
          defaultValue={{ start: 1, end: blocks.length }}
          minValue={1}
          maxValue={blocks.length}
          onChange={onChangeRange}
        />
        <Picker placeholder='Select a theme' onSelectionChange={(val) => { onSelectViewType(val) }} selectedKey={viewType} width={120}>
          <Item key="diffV1">Diff v1</Item>
          <Item key="diffV2">Diff v2</Item>
          <Item key="diffGroup">Diff group</Item>
          <Item key="langstore">Langstore</Item>
          <Item key="regional">Regional</Item>
        </Picker>
        <Picker placeholder='Select a block' onSelectionChange={onSelectBlock} icon="close" width={160}>
          {blockTypes.map(type => <Item key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Item>)}
        </Picker>
        <SearchField onChange={onChangeSearch} onClear={onClearSearch} placeholder='Search' width={160} />
        <Picker placeholder='Select a theme' onSelectionChange={onSelectTheme} selectedKey={theme} width={96}>
          <Item key="light">Light</Item>
          <Item key="dark">Dark</Item>
        </Picker>
        {collapsed ? <ActionButton onClick={onToggleCollapse}><Maximize /></ActionButton> : <ActionButton onClick={onToggleCollapse}><Minimize /></ActionButton>}
        <ActionButton onClick={onSave}>Save</ActionButton>
      </div>
    </div>
  );
}

export default Header;
