import { toHtml } from 'hast-util-to-html';
import { ReactSortable } from "react-sortablejs";
import AcceptReject from './AcceptReject';

export default function DocView({
  blocks,
  viewType,
  addNode,
  resolved,
  removeNode,
  isPreview,
  noResultFound,
  onUpdateList,
  updateMerge,
  hideAcceptRejectAll,
}) {

  function onAccept(id, index, mergeType) {
    if (mergeType === 'deleted') {
      removeNode(id, index);
    } else {
      addNode(id, index);
    }
  }

  function onReject(id, index, mergeType) {
    if (mergeType === 'deleted') {
      addNode(id, index);
    } else {
      removeNode(id, index);
    }
  }

  function onClickBlock(uuid) {
    if (!isPreview) return;
    const container = document.getElementById('doc');
    const elem = document.getElementById(uuid);
    elem.classList.add('highlight');
    container.scrollTop = elem.offsetTop - 20;
    setTimeout(() => {
      elem.classList.remove('highlight');
    }, 1200)
  }

  function renderDocNode(node, index) {
    const elem = toHtml(node.child, {
      upperDoctype: true,
    });
    const mergeType = node.hash?.type;

    return (
      <div onClick={() => { onClickBlock(node.uuid) }} id={node.uuid} key={node.uuid} className={`elem-wrap ${mergeType ? mergeType : 'orig'}`}>
        <div dangerouslySetInnerHTML={{ __html: elem }} />
        {mergeType && !isPreview && (<div className='toolbox'>
          <AcceptReject
            acceptLabel="Accept"
            rejectLabel="Reject"
            onAccept={() => { onAccept(node.uuid, index, mergeType) }}
            onReject={() => { onReject(node.uuid, index, mergeType) }}
          />
        </div>)}
      </div>
    )
  }

  if (noResultFound) {
    return <div className="not-found-message">No result found!</div>
  }

  return (
    <ReactSortable list={blocks} setList={() => { }} onUpdate={onUpdateList}>
      <div className='accept-reject'>
        <AcceptReject
          isHide={(hideAcceptRejectAll || viewType !== 'diffV1')}
          acceptLabel="Accept all"
          rejectLabel="Reject all"
          onAccept={()=> { updateMerge('added') }}
          onReject={()=> { updateMerge('deleted') }}
        />
      </div>
      {blocks?.map((node, i) => renderDocNode(node, i))}
    </ReactSortable>
  )
}



