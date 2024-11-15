import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Search, Users } from 'lucide-react'
import { FaTrash } from "react-icons/fa";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Server Actions
import { srv_getWaitlist, srv_deleteWaitlistUser, srv_sendInvitation } from "@/app/actions/server/admin/waitlistmgmt/primary";
import { WaitlistUser } from "@/models/WaitlistUser";

export function Waitlist() {
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<WaitlistUser | null>(null);

  const fetchWaitlistUsers = async () => {
    try {
      const data = await srv_getWaitlist();
      setWaitlistUsers(data);
    } catch (error) {
      console.error('Error fetching waitlist users:', error);
      toast.error('Error fetching waitlist users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlistUsers();
  }, []);

  

  const filteredUsers = waitlistUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendInvite = async (email: string) => {
    try {
      const result = await srv_sendInvitation(email);
      toast.success('Invitation sent successfully');
      setWaitlistUsers(result);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    }
  };

  const handleDelete = async (user: WaitlistUser) => {
    try {
      const result = await srv_deleteWaitlistUser(user.email);
      toast.success("User removed from waitlist");
      setWaitlistUsers(result);
    } catch (error) {
      toast.error("Failed to remove user from waitlist");
    } finally {
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-full">
      <div className="flex-none mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <Users className="w-6 h-6" />
          Waitlist Management
        </h2>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            You have {waitlistUsers.length} users on the waitlist.
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="h-full border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Signed Up Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-auto">
              {filteredUsers.map((user) => (
                <TableRow key={user.email.toString()}>
                  <TableCell>
                    <div className="font-medium">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.dateSignedUp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isNotified ? "default" : "secondary"}>
                      {user.isNotified ? "Invited" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={user.isNotified}
                        onClick={() => handleSendInvite(user.email)}
                      >
                        {user.isNotified ? "Invited" : "Send Invite"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setUserToDelete(user);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <FaTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {userToDelete?.email} from the waitlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => userToDelete && handleDelete(userToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
