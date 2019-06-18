import { AnchorButton } from '@blueprintjs/core'
import React from 'react'

import { MessageGroup } from '../../typings'

interface Props {
  messageGroups: MessageGroup[]
}

export function MessageDownload(props: Props) {
  const flattenMessages = props.messageGroups.flatMap(mg => [mg.userMessage, ...mg.botMessages])
  const content = JSON.stringify(flattenMessages, undefined, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const fileURL = window.URL.createObjectURL(blob)
  return <AnchorButton icon={'download'} href={fileURL} download={'message_history'} />
}
