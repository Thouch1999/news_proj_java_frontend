import { Button, ButtonGroup, Dropdown } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'

// "Publish now" with a small arrow that opens "Schedule…": the two ways to take a PENDING article live. `onPublish` and
// `onSchedule` open the dialogs (see useWorkflowAction). `block` makes it as wide as its container.
export default function PublishSplitButton({ disabled = false, block = false, drop = 'down', onPublish, onSchedule }) {
  const { t } = useTranslation()
  return (
    <Dropdown as={ButtonGroup} drop={drop} className={block ? 'w-100' : undefined}>
      <Button variant="primary" disabled={disabled} onClick={onPublish}>
        {t('news.workflow.actions.publishNow')}
      </Button>
      <Dropdown.Toggle split variant="primary" disabled={disabled} aria-label={t('news.workflow.actions.moreWays')} />
      <Dropdown.Menu align="end" popperConfig={{ strategy: 'fixed' }}>
        <Dropdown.Item as="button" type="button" onClick={onSchedule}>
          {t('news.workflow.actions.schedule')}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}
