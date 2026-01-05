'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugPage() {
    const [token, setToken] = useState<string | null>(null)
    const [permissions, setPermissions] = useState<any>(null)
    const [accounts, setAccounts] = useState<any>(null)
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`])

    useEffect(() => {
        checkSession()
    }, [])

    const checkSession = async () => {
        addLog('Checking session...')
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
            setToken(session.provider_token)
            addLog(`Token found: ${session.provider_token.substring(0, 10)}...`)
        } else {
            addLog('No provider token found.')
        }
    }

    const checkPermissions = async () => {
        if (!token) return
        addLog('Fetching permissions...')
        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${token}`)
            const data = await res.json()
            setPermissions(data)
            addLog(`Permissions: ${JSON.stringify(data)}`)
        } catch (e: any) {
            addLog(`Permission Error: ${e.message}`)
        }
    }

    const checkAccounts = async () => {
        if (!token) return
        addLog('Fetching accounts...')
        try {
            const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account,name,access_token&access_token=${token}`)
            const data = await res.json()
            setAccounts(data)
            addLog(`Accounts: ${JSON.stringify(data)}`)
        } catch (e: any) {
            addLog(`Account Error: ${e.message}`)
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold">Connection Debugger</h1>

            <Card>
                <CardHeader><CardTitle>1. Token Check</CardTitle></CardHeader>
                <CardContent>
                    <p className="font-mono bg-muted p-2 rounded">{token || 'No Token'}</p>
                    <Button onClick={checkSession} className="mt-2" variant="outline">Refresh Session</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>2. Permissions Check</CardTitle></CardHeader>
                <CardContent>
                    <Button onClick={checkPermissions}>Check /me/permissions</Button>
                    {permissions && (
                        <pre className="mt-4 p-2 bg-slate-900 text-green-400 rounded text-xs overflow-auto">
                            {JSON.stringify(permissions, null, 2)}
                        </pre>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>3. Accounts Check</CardTitle></CardHeader>
                <CardContent>
                    <Button onClick={checkAccounts}>Check /me/accounts</Button>
                    {accounts && (
                        <pre className="mt-4 p-2 bg-slate-900 text-green-400 rounded text-xs overflow-auto">
                            {JSON.stringify(accounts, null, 2)}
                        </pre>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
                <CardContent>
                    <div className="h-40 overflow-auto bg-muted p-2 rounded text-xs font-mono">
                        {logs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
