'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FaPlus, FaCopy } from "react-icons/fa";

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

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaign, setNewCampaign] = useState({ name: '', ref: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      fetchCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
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

  return (
    <div className="h-full w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Campaign Management</h2>
      </div>

      <Card className="p-4 mb-6">
        <form onSubmit={handleCreateCampaign} className="flex gap-4">
          <Input
            placeholder="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Reference Code"
            value={newCampaign.ref}
            onChange={(e) => setNewCampaign({ ...newCampaign, ref: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Description (optional)"
            value={newCampaign.description}
            onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
            className="flex-1"
          />
          <Button type="submit">
            <FaPlus className="mr-2" /> Add Campaign
          </Button>
        </form>
      </Card>

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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(campaign.ref)}
                  >
                    <FaCopy className="mr-2" /> Copy URL
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 