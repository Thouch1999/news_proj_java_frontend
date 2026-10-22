import {
  Archive,
  ArrowCounterclockwise,
  BoxArrowInRight,
  CheckCircle,
  ChatDots,
  Eye,
  EyeSlash,
  ExclamationTriangle,
  Folder,
  Gear,
  Key,
  Pencil,
  PersonCheck,
  PersonDash,
  PersonPlus,
  PlusCircle,
  Send,
  ShieldCheck,
  Tag,
  Trash,
  XCircle,
} from 'react-bootstrap-icons'

// The actions the backend writes in the activity log (the enum ActivityAction). `icon` goes in the soft circle of the row,
// `tone` is its colour (see .activity-kind in _theme.scss): create green, edit blue, publish primary, reject / delete /
// failed sign-in red, everything else grey. `group` is the group of the action select. The sentence of each action is
// under activity.sentence in the translations.
export const ACTIVITY_ACTIONS = {
  NEWS_CREATED: { icon: PlusCircle, tone: 'create', group: 'articles' },
  NEWS_UPDATED: { icon: Pencil, tone: 'edit', group: 'articles' },
  NEWS_SUBMITTED: { icon: Send, tone: 'other', group: 'articles' },
  NEWS_PUBLISHED: { icon: CheckCircle, tone: 'publish', group: 'articles' },
  NEWS_REJECTED: { icon: XCircle, tone: 'danger', group: 'articles' },
  NEWS_ARCHIVED: { icon: Archive, tone: 'other', group: 'articles' },
  NEWS_RESTORED: { icon: ArrowCounterclockwise, tone: 'publish', group: 'articles' },
  NEWS_DELETED: { icon: Trash, tone: 'danger', group: 'articles' },
  COMMENTS_TOGGLED: { icon: ChatDots, tone: 'other', group: 'articles' },
  COMMENT_HIDDEN: { icon: EyeSlash, tone: 'other', group: 'comments' },
  COMMENT_SHOWN: { icon: Eye, tone: 'other', group: 'comments' },
  COMMENT_DELETED: { icon: Trash, tone: 'danger', group: 'comments' },
  USER_CREATED: { icon: PersonPlus, tone: 'create', group: 'users' },
  USER_ACTIVATED: { icon: PersonCheck, tone: 'other', group: 'users' },
  USER_DEACTIVATED: { icon: PersonDash, tone: 'other', group: 'users' },
  USER_ROLES_CHANGED: { icon: ShieldCheck, tone: 'edit', group: 'users' },
  USER_PASSWORD_RESET: { icon: Key, tone: 'other', group: 'users' },
  SUPER_ADMIN_TRANSFERRED: { icon: ShieldCheck, tone: 'edit', group: 'users' },
  CATEGORY_CREATED: { icon: Folder, tone: 'create', group: 'categoriesTags' },
  CATEGORY_UPDATED: { icon: Folder, tone: 'edit', group: 'categoriesTags' },
  CATEGORY_DELETED: { icon: Trash, tone: 'danger', group: 'categoriesTags' },
  TAG_CREATED: { icon: Tag, tone: 'create', group: 'categoriesTags' },
  TAG_UPDATED: { icon: Tag, tone: 'edit', group: 'categoriesTags' },
  TAG_DELETED: { icon: Trash, tone: 'danger', group: 'categoriesTags' },
  SETTINGS_UPDATED: { icon: Gear, tone: 'edit', group: 'settings' },
  LOGIN_SUCCESS: { icon: BoxArrowInRight, tone: 'other', group: 'signIn' },
  LOGIN_FAILED: { icon: ExclamationTriangle, tone: 'danger', group: 'signIn' },
  PASSWORD_CHANGED: { icon: Key, tone: 'other', group: 'signIn' },
}

// The groups of the action select, in the order they are shown (the names are under activity.groups)
export const ACTIVITY_GROUPS = ['articles', 'comments', 'users', 'categoriesTags', 'settings', 'signIn']

// The actions of a group, in the order of ACTIVITY_ACTIONS
export const actionsOfGroup = (group) => Object.keys(ACTIVITY_ACTIONS).filter((action) => ACTIVITY_ACTIONS[action].group === group)

// The value of the action select (and of ?action= in the URL): '' for any action, an action name, or `group:<name>` for all
// the actions of a group. Returns the list of actions to ask the backend for (an empty list: any action).
export function actionsOfChoice(choice) {
  if (choice?.startsWith('group:')) {
    const group = choice.slice('group:'.length)
    return ACTIVITY_GROUPS.includes(group) ? actionsOfGroup(group) : []
  }
  return ACTIVITY_ACTIONS[choice] ? [choice] : []
}

export const isActionChoice = (choice) => !choice || Boolean(actionsOfChoice(choice).length)

// What a target is (the enum ActivityTargetType)
export const TARGET_TYPES = ['NEWS', 'COMMENT', 'USER', 'CATEGORY', 'TAG', 'SETTINGS', 'AUTH']

// The date presets of the toolbar; 'custom' shows two date fields. `days` counts today (7: today and the six days before).
export const RANGE_PRESETS = [
  { value: '', labelKey: 'activity.ranges.all' },
  { value: 'today', labelKey: 'activity.ranges.today', days: 1 },
  { value: '7d', labelKey: 'activity.ranges.7d', days: 7 },
  { value: '30d', labelKey: 'activity.ranges.30d', days: 30 },
  { value: 'custom', labelKey: 'activity.ranges.custom' },
]

export const ACTIVITY_PAGE_SIZES = [20, 50, 100] // the backend gives at most 100 per page

// How many entries the cards on the article and user pages and on the dashboard show
export const HISTORY_CARD_SIZE = 8
export const FEED_SIZE = 8
