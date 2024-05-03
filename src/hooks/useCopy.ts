import { useState, useEffect } from 'react'

export function UseCopy() {
    const [copied, setCopied] = useState(false)
    
    const copyToClipboard = (valueToCopy: string) => {
        navigator.clipboard.writeText(valueToCopy)
        setCopied(true)
    }
    
    useEffect(() => {
        if (copied) {
        const timeout = setTimeout(() => {
            setCopied(false)
        }, 2000)
    
        return () => {
            clearTimeout(timeout)
        }
        }
    }, [copied])
    
    return {copied, copyToClipboard}
}