import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Search, UserCog, Lock, Unlock } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { toast } from "sonner"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// Server Actions
import { srv_getUsers, srv_updateUser } from '@/app/actions/server/admin/usermgmt/primary'
import { CompleteUserProfile } from '@/lib/useUser'

interface User extends CompleteUserProfile {
  isUpdating?: boolean;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const { user: currentUser } = useUser()
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await srv_getUsers(currentUser?.id as string);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId: string, updates: { role?: string, tier?: string, onBoardingComplete?: boolean }) => {
    if (isLocked) return;

    try {
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, isUpdating: true }
            : user
        )
      );

      await srv_updateUser(currentUser?.id as string, { targetUserId: userId, ...updates });

      toast.success(`User ${Object.keys(updates).join(' and ')} updated successfully`);

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error("Failed to update user. Please try again.");

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, isUpdating: false }
            : user
        )
      );
    }
  };

  const onLock = () => {
    setIsLocked(true);
    setLockedModalOpen(false);
  }

  const onUnlock = () => {
    setIsLocked(false);
    setLockedModalOpen(false);
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col w-full max-w-full">
      <div className="flex-none mb-6 items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="w-6 h-6" />
          User Management
          <Dialog open={lockedModalOpen} onOpenChange={setLockedModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>{isLocked ? 'Lock Editing' : 'Unlock Editing'}</DialogTitle>
              <DialogDescription>
                Are you sure you want to {isLocked ? 'lock' : 'unlock'} editing? This will allow changes to be made to user data.
              </DialogDescription>
              <DialogFooter>
                {isLocked ?
                  <Button variant="outline" onClick={() => onUnlock()}>Unlock</Button>
                  :
                  <Button onClick={() => onLock()}>Lock</Button>
                }
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </h2>

      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-none space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            You have {users.length} users.
          </div>
        </div>

        <div className="flex-1 min-h-0 mt-6">
          <div className="h-full border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-auto">
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={
                      user.id === currentUser?.id
                        ? "bg-blue-500/5 hover:bg-blue-500/10 border-b-2 border-blue-500 "
                        : "hover:bg-muted/50"
                    }
                  >
                    <TableCell className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleUserUpdate(user.id, { role: value })}
                        disabled={user.isUpdating || isLocked}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.tier}
                        onValueChange={(value) => handleUserUpdate(user.id, { tier: value })}
                        disabled={user.isUpdating || isLocked}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="power">Power</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.onBoardingComplete.toString()}
                        onValueChange={(value) => handleUserUpdate(user.id, { onBoardingComplete: value === 'true' })}
                        disabled={user.isUpdating || isLocked}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Completed</SelectItem>
                          <SelectItem value="false">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(user.lastSignInAt || '').toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(user.dateCreated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" disabled={isLocked}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
