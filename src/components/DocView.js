import { toHtml } from 'hast-util-to-html';
import { ReactSortable } from "react-sortablejs";
import Close from '@spectrum-icons/workflow/Close';
import Tick from '@spectrum-icons/workflow/Checkmark';

export default function DocView({ blocks, addNode, removeNode, isPreview, noResultFound, onUpdateList }) {
 
  function onAccept(id, index, mergeType) {
    if (mergeType === 'deleted') {
      removeNode(id, index);
    } else {
      addNode(id, index);
    }
  }

  function onReject(id, index, mergeType) {
    if (mergeType === 'deleted') {
      addNode(index);
    } else {
      removeNode(id, index);
    }
  }

  function onClickBlock(uuid) {
    const container = document.getElementById('doc');
    const elem = document.getElementById(uuid);
    elem.classList.add('highlight');
    container.scrollTop = elem.offsetTop - 20;
    setTimeout(()=> {
      elem.classList.remove('highlight');
    }, 1200)
  }

  function renderDocNode(node, index) {
    const elem = toHtml(node.child, {
      upperDoctype: true,
    });
    const mergeType = node.hash?.type;

    return (
      <div onClick={() => { onClickBlock(node.uuid)}} id={node.uuid} key={node.uuid} className={`elem-wrap ${mergeType ? mergeType : 'orig'}`}>
        <div dangerouslySetInnerHTML={{ __html: elem }} />
        {mergeType && !isPreview && (<div className='toolbox'>
          <div onClick={() => { onReject(node.uuid, index, mergeType) }} className='icon cross-icon'><Close/></div>
          <div onClick={() => { onAccept(node.uuid, index, mergeType) }} className='icon right-icon'><Tick/></div>
        </div>)}
      </div>
    )
  }

  if (noResultFound) {
    return <div class="not-found-message">No result found!</div>
  }

  return (
    <ReactSortable list={blocks} setList={()=>{}} onUpdate={onUpdateList}>
      {blocks?.map((node, i) => renderDocNode(node, i))}
    </ReactSortable>
  )
}



