import { Link } from '../link/link';

// NOTE: internal

interface BaseAction {
  link: Link;
}

interface CopyAction extends BaseAction {
  action: 'copy';
  filePath: string;
}

interface InitAction extends BaseAction {
  action: 'init';
}

export type Action = CopyAction | InitAction;
