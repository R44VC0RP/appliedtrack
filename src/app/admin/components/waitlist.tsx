import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
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

interface WaitlistUser {
  _id: string;
  email: string;
  dateSignedUp: string;
}

export function Waitlist() {
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<WaitlistUser | null>(null);

  useEffect(() => {
    fetchWaitlistUsers();
  }, []);

  const fetchWaitlistUsers = async () => {
    try {
      const response = await fetch('/api/waitlist');
      if (response.ok) {
        const data = await response.json();
        setWaitlistUsers(data);
      }
    } catch (error) {
      console.error('Error fetching waitlist users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = waitlistUsers.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (user: WaitlistUser) => {
    try {
      const response = await fetch(`/api/waitlist/${user._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User removed from waitlist",
        });
        fetchWaitlistUsers(); // Refresh the list
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user from waitlist",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card className="h-full flex flex-col w-[80vw]">
      <CardHeader className="flex-none">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Waitlist Management
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="flex-none space-y-6">
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

        <div className="flex-1 min-h-0 mt-6">
          <div className="h-full border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Signed Up Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="overflow-auto">
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.dateSignedUp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Send Invite
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
      </CardContent>
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
    </Card>
  );
}
