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
  lastSeen?: string
  isOnline?: boolean
  referralCode?: string
}

interface CreateUserForm {
  username: string
  password: string
  role: string
  points: number
}

interface AllocatePointsForm {
  targetUserId: string
  points: number
  action: 'add' | 'remove'
}

export function UserManagementPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    role: 'user',
    points: 0
  })
  const [allocateForm, setAllocateForm] = useState<AllocatePointsForm>({
    targetUserId: '',
    points: 0,
    action: 'add'
  })
  const [creating, setCreating] = useState(false)
  const [allocating, setAllocating] = useState(false)

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (!user) return []
    
    const roleHierarchy = {
      'associate_master': ['user'],
      'master': ['user', 'associate_master'],
      'senior_master': ['user', 'associate_master', 'master'],
      'super_master': ['user', 'associate_master', 'master', 'senior_master'],
      'super_admin': ['user', 'associate_master', 'master', 'senior_master', 'super_master', 'super_admin']
    }
    
    return roleHierarchy[user.role as keyof typeof roleHierarchy] || []
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.dashboard.downline || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async () => {
    if (!createForm.username || !createForm.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/masters/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(createForm)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message || 'User created successfully!')
        setCreateForm({ username: '', password: '', role: 'user', points: 0 })
        fetchUsers() // Refresh user list
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const allocatePoints = async () => {
    if (!allocateForm.targetUserId || allocateForm.points <= 0) {
      toast.error('Please select a user and enter valid points')
      return
    }

    setAllocating(true)
    try {
      const response = await fetch('/api/masters/allocate-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(allocateForm)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message || `Points ${allocateForm.action === 'add' ? 'allocated' : 'removed'} successfully!`)
        setAllocateForm({ targetUserId: '', points: 0, action: 'add' })
        fetchUsers() // Refresh user list
      } else {
        toast.error(result.error || 'Failed to allocate points')
      }
    } catch (error) {
      console.error('Failed to allocate points:', error)
      toast.error('Failed to allocate points')
    } finally {
      setAllocating(false)
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

  if (loading) {
    return (
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-white/60">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">👥</span>
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700 rounded-lg p-1 gap-1 overflow-hidden">
            <TabsTrigger 
              value="create" 
              className="w-full text-xs sm:text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white whitespace-nowrap px-2 py-2 min-h-[40px] text-center rounded-md focus-visible:outline-none focus-visible:ring-0 focus:outline-none ring-0 outline-none shadow-none data-[state=active]:shadow-none"
            >
              Create User
            </TabsTrigger>
            <TabsTrigger 
              value="allocate" 
              className="w-full text-xs sm:text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white whitespace-nowrap px-2 py-2 min-h-[40px] text-center rounded-md focus-visible:outline-none focus-visible:ring-0 focus:outline-none ring-0 outline-none shadow-none data-[state=active]:shadow-none"
            >
              Allocate Points
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="w-full text-xs sm:text-sm text-gray-800 dark:text-gray-200 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-gray-700/50 data-[state=active]:text-black dark:data-[state=active]:text-white whitespace-nowrap px-2 py-2 min-h-[40px] text-center rounded-md focus-visible:outline-none focus-visible:ring-0 focus:outline-none ring-0 outline-none shadow-none data-[state=active]:shadow-none"
            >
              My Users ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white text-sm">Username</Label>
                <Input
                  id="username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  placeholder="Enter username"
                  className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  placeholder="Enter password"
                  className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white text-sm">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({...createForm, role: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role} value={role} className="text-white">
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points" className="text-white text-sm">Initial Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={createForm.points}
                  onChange={(e) => setCreateForm({...createForm, points: parseInt(e.target.value) || 0})}
                  placeholder="Enter initial points"
                  className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
            
            <Button 
              onClick={createUser} 
              disabled={creating}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-10 text-sm"
            >
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </TabsContent>

          <TabsContent value="allocate" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetUser" className="text-white text-sm">Select User</Label>
                <Select
                  value={allocateForm.targetUserId}
                  onValueChange={(value) => setAllocateForm({...allocateForm, targetUserId: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50">
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-white">
                        {user.username} ({user.points} points)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points" className="text-white text-sm">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={allocateForm.points}
                  onChange={(e) => setAllocateForm({...allocateForm, points: parseInt(e.target.value) || 0})}
                  placeholder="Enter points"
                  className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action" className="text-white text-sm">Action</Label>
                <Select
                  value={allocateForm.action}
                  onValueChange={(value: 'add' | 'remove') => setAllocateForm({...allocateForm, action: value})}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white h-10 text-sm focus:ring-2 focus:ring-purple-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    <SelectItem value="add" className="text-white">Add Points</SelectItem>
                    <SelectItem value="remove" className="text-white">Remove Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={allocatePoints} 
              disabled={allocating}
              className={`w-full text-white h-10 text-sm ${
                allocateForm.action === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {allocating ? 'Processing...' : `${allocateForm.action === 'add' ? 'Add' : 'Remove'} Points`}
            </Button>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/60">No users found in your downline</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Points</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-white/20">
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{user.username}</div>
                            {user.referralCode && (
                              <div className="text-xs text-white/60">Code: {user.referralCode}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-white`}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          {user.points.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={user.isOnline ? 'bg-green-500' : 'bg-gray-500'}>
                            {user.isOnline ? '🟢 Online' : '⚫ Offline'}
                          </Badge>
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
