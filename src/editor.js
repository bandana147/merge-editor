import { toHast as mdast2hast, defaultHandlers } from 'mdast-util-to-hast';
import { raw } from 'hast-util-raw';
import { mdast2hastGridTablesHandler, TYPE_TABLE } from '@adobe/mdast-util-gridtables';
import parseMarkdown from './libs/parseMarkdown.bundle.js';
import objectHash from 'object-hash';
import { v4 as uuidv4 } from 'uuid';

let mergedMdast = {};
let langstoreMdast = {};
let regionalMdast = {};
let hashArray = [];

export async function getMdastFromMd(mdContent) {
  const state = { content: { data: mdContent }, log: '' };
  await parseMarkdown(state);
  return state.content.mdast;
}

async function getMd(path) {
  const mdPath = `${path}.md`;
  const mdFile = await fetch(mdPath);
  return mdFile.text();
}

async function getMdast(path) {
  const mdContent = await getMd(path);
  return getMdastFromMd(mdContent);
}

const hashToContentMap = new Map();

function processMdast(nodes) {
  const arrayWithContentHash = [];
  nodes.forEach((node) => {
    const hash = objectHash.sha1(node);
    arrayWithContentHash.push(hash);
    hashToContentMap.set(hash, node);
  });
  return arrayWithContentHash;
}

function getProcessedMdast(mdast) {
  const nodes = mdast.children || [];
  return processMdast(nodes);
}

function getMergedMdast(langstoreNowProcessedMdast, livecopyProcessedMdast, hashArray) {
  const mergedMdast = { type: 'root', children: [] };
  function addTrackChangesInfo(author, action, root) {
    root.author = author;
    root.action = action;

    function addTrackChangesInfoToChildren(content) {
      if (content?.children) {
        const { children } = content;
        for (let i = 0; i < children.length; i += 1) {
          const child = children[i];
          if (child.type === 'text' || child.type === 'gtRow' || child.type === 'image') {
            child.author = author;
            child.action = action;
          }
          if (child.type !== 'text') {
            addTrackChangesInfoToChildren(child);
          }
        }
      }
    }
    addTrackChangesInfoToChildren(root);
  }

  // Iterate and insert content in mergedMdast as long as both arrays have content
  const length = Math.min(langstoreNowProcessedMdast.length, livecopyProcessedMdast.length);
  let index;
  for (index = 0; index < length; index += 1) {
    if (langstoreNowProcessedMdast[index] === livecopyProcessedMdast[index]) {
      const content = hashToContentMap.get(langstoreNowProcessedMdast[index]);
      mergedMdast.children.push(content);
      hashArray.push({ hash: langstoreNowProcessedMdast[index] });
    } else {
      const langstoreContent = hashToContentMap.get(langstoreNowProcessedMdast[index]);
      // addTrackChangesInfo('Langstore Version', 'deleted', langstoreContent);
      mergedMdast.children.push(langstoreContent);
      hashArray.push({ hash: langstoreNowProcessedMdast[index], type: 'deleted', desc: 'Langstore Version' });
      const livecopyContent = hashToContentMap.get(livecopyProcessedMdast[index]);
      // addTrackChangesInfo('Regional Version', 'added', livecopyContent);
      mergedMdast.children.push(livecopyContent);
      hashArray.push({ hash: livecopyProcessedMdast[index], type: 'added', desc: 'Regional Version' });
    }
  }

  // Insert the leftover content in langstore if any
  if (index < langstoreNowProcessedMdast.length) {
    for (; index < langstoreNowProcessedMdast.length; index += 1) {
      const langstoreContent = hashToContentMap.get(langstoreNowProcessedMdast[index]);
      // addTrackChangesInfo('Langstore Version', 'deleted', langstoreContent);
      mergedMdast.children.push(langstoreContent);
      hashArray.push({ hash: langstoreNowProcessedMdast[index], type: 'deleted', desc: 'Langstore Version' });
    }
  }

  // Insert the leftover content in livecopy if any
  if (index < livecopyProcessedMdast.length) {
    for (; index < livecopyProcessedMdast.length; index += 1) {
      const livecopyContent = hashToContentMap.get(livecopyProcessedMdast[index]);
      mergedMdast.children.push(livecopyContent);
      hashArray.push({ hash: livecopyProcessedMdast[index] });
    }
  }

  return mergedMdast;
}

export function getCustomHast(type) {
  let mdast;
  if (type === 'regional') {
    mdast = regionalMdast;
  } else if(type === 'langstore') {
    mdast = langstoreMdast;
  } else {
    mdast = mergedMdast;
  }

  return processHast(mdast, type);
}

function processHast(mdast, type) {
  const hast = mdast2hast(mdast, {
    handlers: {
      ...defaultHandlers,
      [TYPE_TABLE]: mdast2hastGridTablesHandler(),
    },
    allowDangerousHtml: true,
  });

  raw(hast);
  hast.children = hast.children.filter(child => !(child.type === 'text' && child.value === '\n'))
    .map(function (child, i) {
      const obj = {
        child,
        uuid: uuidv4(),
      }
      if (type === 'diffV1') {
        obj.hash = hashArray[i]
      }
      return obj;
    });
    return hast;
}

export async function md2html(path1, path2) {
  langstoreMdast = await getMdast(path1);
  const processedMdast1 = getProcessedMdast(langstoreMdast);
  regionalMdast = await getMdast(path2);
  const processedMdast2 = getProcessedMdast(regionalMdast);
  mergedMdast = getMergedMdast(processedMdast1, processedMdast2, hashArray);

  return processHast(mergedMdast, 'diffV1');
}
