"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  role: string
  points: number
  createdAt: string
}

interface CreatePointsForm {
  targetUserId: string
  points: number
  action: 'add' | 'remove'
}

export function SuperAdminPanel() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createForm, setCreateForm] = useState<CreatePointsForm>({
    targetUserId: '',
    points: 0,
    action: 'add'
  })
  const [processing, setProcessing] = useState(false)

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('jwt')
      if (!token) {
        toast.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAllUsers(data.users || [])
        } else {
          toast.error(data.error || 'Failed to load users')
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch users:', response.status, errorData)
        toast.error(errorData.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const createPoints = async () => {
    if (!createForm.targetUserId || createForm.points <= 0) {
      toast.error('Please select a user and enter valid points')
      return
    }

    setProcessing(true)
    try {
      const token = localStorage.getItem('jwt')
      if (!token) {
        toast.error('No authentication token found')
        setProcessing(false)
        return
      }

      const response = await fetch('/api/admin/create-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success(result.message || `Points ${createForm.action === 'add' ? 'created' : 'removed'} successfully!`)
        setCreateForm({ targetUserId: '', points: 0, action: 'add' })
        fetchAllUsers() // Refresh user list
      } else {
        toast.error(result.error || 'Failed to process points')
      }
    } catch (error) {
      console.error('Failed to process points:', error)
      toast.error('Failed to process points')
    } finally {
      setProcessing(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors = {
      user: 'bg-gray-500',
      associate_master: 'bg-blue-500',
      master: 'bg-green-500',
      senior_master: 'bg-purple-500',
      super_master: 'bg-orange-500',
      super_admin: 'bg-red-500'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-500'
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (user?.role !== 'super_admin') {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent>
          <div className="text-center py-8">
            <p className="text-white/60">Access denied. Super Admin privileges required.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Super Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-white/60">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">👑</span>
          Super Admin Panel
          <Badge className="bg-red-500 text-white">Unlimited Power</Badge>
          <Button
            onClick={fetchAllUsers}
            disabled={loading}
            size="sm"
            variant="outline"
            className="ml-auto border-white/20 text-white hover:bg-white/10"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700">
            <TabsTrigger value="create" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white">Create Points</TabsTrigger>
            <TabsTrigger value="users" className="text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white">All Users</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-400">Super Admin Privileges</h4>
                  <p className="text-yellow-200 text-sm">
                    You can create unlimited points out of thin air. Use this power responsibly!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetUser" className="text-white">Select User</Label>
                <Select
                  value={createForm.targetUserId}
                  onValueChange={(value) => setCreateForm({...createForm, targetUserId: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {allUsers.map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-white">
                        {user.username} ({user.points} points) - {formatRole(user.role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points" className="text-white">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={createForm.points}
                  onChange={(e) => setCreateForm({...createForm, points: parseInt(e.target.value) || 0})}
                  placeholder="Enter points"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action" className="text-white">Action</Label>
                <Select
                  value={createForm.action}
                  onValueChange={(value: 'add' | 'remove') => setCreateForm({...createForm, action: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    <SelectItem value="add" className="text-white">Create Points</SelectItem>
                    <SelectItem value="remove" className="text-white">Remove Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={createPoints} 
              disabled={processing}
              className={`w-full text-white ${
                createForm.action === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {processing ? 'Processing...' : `${createForm.action === 'add' ? 'Create' : 'Remove'} Points`}
            </Button>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-bold text-blue-400 mb-2">Super Admin Features:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Create unlimited points out of thin air</li>
                <li>• Remove points from any user</li>
                <li>• No balance restrictions</li>
                <li>• Complete system control</li>
                <li>• Full audit trail access</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {allUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/60">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Points</TableHead>
                      <TableHead className="text-white">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/20">
                        <TableCell className="text-white">
                          <div className="font-medium">{user.username}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-white`}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          {user.points.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-white text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
