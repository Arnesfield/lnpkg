import { Link } from '../link/link';

// NOTE: internal

interface BaseAction {
  link: Link;
}

interface InitAction extends BaseAction {
  type: 'init';
}

interface CopyAction extends BaseAction {
  type: 'copy';
  filePath: string;
}

interface RemoveAction extends BaseAction {
  type: 'remove';
  filePath: string;
}

export type Action = InitAction | CopyAction | RemoveAction;
