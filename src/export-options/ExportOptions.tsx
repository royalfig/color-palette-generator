import { CopyIcon, DownloadIcon, ImageIcon, LinkIcon } from '@phosphor-icons/react'
import Button from '../components/button/Button'
import { container } from './export-options.module.css'

export function ExportOptions() {
  return (
    <div className={container}>
      <Button handler={() => {}} active={false}>
        <ImageIcon weight="fill" size={24} />
      </Button>
      <Button handler={() => {}} active={false}>
        <DownloadIcon weight="fill" size={24} />
      </Button>
      <Button handler={() => {}} active={false}>
        <CopyIcon weight="fill" size={24} />
      </Button>
      <Button handler={() => {}} active={false}>
        <LinkIcon weight="fill" size={24} />
      </Button>
    </div>
  )
}
