'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaPlus, FaCopy, FaQrcode, FaDownload, FaTrash } from "react-icons/fa";
import { useQRCode } from 'next-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Campaign {
  _id: string;
  name: string;
  ref: string;
  description?: string;
  visits: number;
  signups: number;
  dateCreated: string;
  isActive: boolean;
}

function CreateCampaignDialog({ onCampaignCreated }: { onCampaignCreated: () => void }) {
  const [newCampaign, setNewCampaign] = useState({ name: '', ref: '', description: '' });
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampaign),
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });

      setNewCampaign({ name: '', ref: '', description: '' });
      setOpen(false);
      onCampaignCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FaPlus className="mr-2" /> Add Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
          <Input
            placeholder="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />
          <Input
            placeholder="Reference Code"
            value={newCampaign.ref}
            onChange={(e) => setNewCampaign({ ...newCampaign, ref: e.target.value })}
          />
          <Input
            placeholder="Description (optional)"
            value={newCampaign.description}
            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
          />
          <Button type="submit">Create Campaign</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { Canvas } = useQRCode();
  const [selectedQR, setSelectedQR] = useState<{ ref: string; url: string } | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (ref: string) => {
    const url = `${window.location.origin}?ref=${ref}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Campaign URL copied to clipboard",
    });
  };

  const showQRPreview = (ref: string) => {
    const url = `${window.location.origin}?ref=${ref}`;
    setSelectedQR({ ref, url });
  };

  const downloadQR = () => {
    if (!selectedQR) return;
    
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `appliedtrack-${selectedQR.ref}-qr.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  const deleteCampaign = async (campaign: Campaign) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });

      fetchCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setCampaignToDelete(null);
    }
  };

  return (
    <div className="h-full w-[90vw] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Campaign Management</h2>
        <CreateCampaignDialog onCampaignCreated={fetchCampaigns} />
      </div>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Signups</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign._id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.ref}</TableCell>
                <TableCell>{campaign.visits}</TableCell>
                <TableCell>{campaign.signups}</TableCell>
                <TableCell>{new Date(campaign.dateCreated).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(campaign.ref)}
                    >
                      <FaCopy className="mr-2" /> Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showQRPreview(campaign.ref)}
                    >
                      <FaQrcode className="mr-2" /> QR Code
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setCampaignToDelete(campaign)}
                    >
                      <FaTrash className="mr-2" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for Campaign: {selectedQR?.ref}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div id="qr-canvas" className="bg-white p-4 rounded-lg">
              {selectedQR && (
                <Canvas
                  text={selectedQR.url}
                  options={{
                    errorCorrectionLevel: 'H',
                    margin: 2,
                    scale: 8,
                    width: 300,
                    color: {
                      dark: '#0f172a',
                      light: '#ffffff',
                    },
                  }}
                  logo={{
                    src: '/applied-track-logo-curved.png',
                    options: {
                      width: 75,
                    }
                  }}
                />
              )}
            </div>
            <Button onClick={downloadQR} className="w-full">
              <FaDownload className="mr-2" /> Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign "{campaignToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => campaignToDelete && deleteCampaign(campaignToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 