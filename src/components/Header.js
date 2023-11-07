import { useState } from 'react';
import { SearchField, Picker, Item, ActionButton } from '@adobe/react-spectrum';
import Maximize from '@spectrum-icons/workflow/Maximize';
import Minimize from '@spectrum-icons/workflow/Minimize';
import Add from '@spectrum-icons/workflow/Add';
import Remove from '@spectrum-icons/workflow/Remove';

function Header({
  allBlocks = [],
  setNoResultFound,
  blockTypes,
  collapsed,
  setSearchResult,
  onToggleCollapse,
  scaleDown,
  scaleUp,
  onSave,
  onSelectTheme,
  theme,
}) {

  const [ selectedBlock, setSelectedBlock ] = useState('all');
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

  function onClearSearch() {
    setNoResultFound(false);
  }

  function onChangeSearch(searchKeyword) {
    if (searchKeyword.trim().length <= 0) {
      setSearchResult([]);
      return;
    }
    const foundNodes = [];
    searchWordInAST(allBlocks, searchKeyword, foundNodes);
    if (foundNodes.length > 0) {
      setNoResultFound(false);
      setSearchResult(foundNodes);
    } else {
      setNoResultFound(true);
    }
  }

  function onSelectBlock(searchKeyword) {
    setSelectedBlock(searchKeyword);
    const miloBlocks = allBlocks.filter(block => {
      return block.child.tagName === 'table';
    });
    const foundNodes = miloBlocks.reduce((acc, curr) => {
      const block = curr.child.children?.[0]?.children?.[0]?.children?.[0]?.children?.[0].value;
      const blockName = block.split(' (');
      if (searchKeyword === blockName[0]) {
        acc.push(curr.uuid);
      }
      return acc;
    }, [])
    setSearchResult(foundNodes);
  }

  return (
    <div id="topnav">
      <div>Document.docx</div>
      <div className="nav-wrapper">
        <Picker placeholder='Select a block' onSelectionChange={onSelectBlock} icon="close" selectedKey={selectedBlock}>
          {blockTypes.map(type => <Item key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Item>)}
          <Item key="all">All</Item>
        </Picker>
        <SearchField onChange={onChangeSearch} onClear={onClearSearch} placeholder='Search' />
        <Picker placeholder='Select a theme' onSelectionChange={onSelectTheme} selectedKey={theme}>
          <Item key="light">Light</Item>
          <Item key="dark">Dark</Item>
        </Picker>
        {collapsed ? <ActionButton onClick={onToggleCollapse}><Maximize /></ActionButton> : <ActionButton onClick={onToggleCollapse}><Minimize /></ActionButton>}
        <ActionButton onClick={scaleDown}><Remove /></ActionButton>
        <ActionButton onClick={scaleUp}><Add /></ActionButton>
        <ActionButton onClick={onSave}>Save</ActionButton>
      </div>
    </div>
  );
}

export default Header;
