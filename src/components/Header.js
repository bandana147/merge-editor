import { useState } from 'react';
import { SearchField, Picker, Item, ActionButton, RangeSlider } from '@adobe/react-spectrum';
import Maximize from '@spectrum-icons/workflow/Maximize';
import Minimize from '@spectrum-icons/workflow/Minimize';
import AcceptReject from './AcceptReject';
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

  const [selectedBlock, setSelectedBlock] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  function filterBlockInAST(blockNodes, searchKeyword) {
    const miloBlocks = blockNodes.filter(block => {
      return block.child.tagName === 'table';
    });
    const foundNodes = miloBlocks.reduce((acc, curr) => {
      const block = findBlockName(curr);
      const blockName = block.split(' (');
      if (searchKeyword === blockName[0]) {
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
    if (selectedBlock !== 'all') {
      onSelectBlock(selectedBlock, true);
    } else {
      const all = blocks.map(child => child.uuid);
      setSearchResult(all);
    }
  }

  function onChangeSearch(searchKeyword, searchFromAll) {
    const blockToSearchFrom = searchFromAll ? blocks : searchResult;
    setSearchTerm(searchKeyword);
    if (searchKeyword.trim().length <= 0) {
      onClearSearch();
    } else {
      const foundNodes = [];
      searchWordInAST(blockToSearchFrom, searchKeyword, foundNodes);
      if (foundNodes.length > 0) {
        setNoResultFound(false);
        setSearchResult(foundNodes);
      } else {
        setNoResultFound(true);
      }
    }
  }

  function onSelectBlock(searchKeyword, searchFromAll) {
    const blockToSearchFrom = searchFromAll ? blocks : searchResult;
    setSelectedBlock(searchKeyword);
    if (searchKeyword === 'all') {
      clearFilter();
    } else {
      const foundNodes = filterBlockInAST(blockToSearchFrom, searchKeyword);
      if (foundNodes.length > 0) {
        setNoResultFound(false);
        setSearchResult(foundNodes);
      } else {
        setNoResultFound(true);
      }
    }
  }

  return (
    <div id="topnav" className={theme}>
      <div>Document.docx</div>
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
        <Picker placeholder='Select a block' onSelectionChange={onSelectBlock} icon="close" selectedKey={selectedBlock} width={160}>
          {blockTypes.map(type => <Item key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Item>)}
          <Item key="all">All blocks</Item>
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
