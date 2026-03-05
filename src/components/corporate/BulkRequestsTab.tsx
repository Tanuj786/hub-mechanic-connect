import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Plus, Loader2, Send } from 'lucide-react';

interface Props {
  corporateId: string;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  accepted: 'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const BulkRequestsTab = ({ corporateId, onUpdate }: Props) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [form, setForm] = useState({ service_type_id: '', description: '', address: '' });
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, [corporateId]);

  const fetchAll = async () => {
    const [{ data: bulkReqs }, { data: vehs }, { data: types }] = await Promise.all([
      supabase.from('bulk_service_requests').select('*, service_requests(*), fleet_vehicles(vehicle_name, vehicle_number)').eq('corporate_id', corporateId).order('created_at', { ascending: false }),
      supabase.from('fleet_vehicles').select('*').eq('corporate_id', corporateId).eq('is_active', true),
      supabase.from('service_types').select('*'),
    ]);
    setRequests(bulkReqs || []);
    setVehicles(vehs || []);
    setServiceTypes(types || []);
    setLoading(false);
  };

  const toggleVehicle = (id: string) => {
    setSelectedVehicles(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const handleBulkSubmit = async () => {
    if (!user || !form.service_type_id || !form.address || selectedVehicles.length === 0) {
      toast({ title: 'Error', description: 'Select vehicles, service type, and address', variant: 'destructive' });
      return;
    }

    setSending(true);
    const batchId = `BATCH-${Date.now()}`;

    for (const vehicleId of selectedVehicles) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      // Create service request
      const { data: sr, error: srError } = await supabase.from('service_requests').insert({
        customer_id: user.id,
        service_type_id: form.service_type_id,
        vehicle_type: vehicle?.vehicle_type || 'car',
        customer_address: form.address,
        description: `[Fleet: ${vehicle?.vehicle_name} - ${vehicle?.vehicle_number}] ${form.description || ''}`.trim(),
      }).select().single();

      if (srError || !sr) {
        console.error('Failed to create request for', vehicleId, srError);
        continue;
      }

      // Link to bulk
      await supabase.from('bulk_service_requests').insert({
        corporate_id: corporateId,
        fleet_vehicle_id: vehicleId,
        service_request_id: sr.id,
        batch_id: batchId,
        notes: form.description || null,
      });
    }

    setSending(false);
    setDialogOpen(false);
    setSelectedVehicles([]);
    setForm({ service_type_id: '', description: '', address: '' });
    toast({ title: 'Bulk Requests Sent!', description: `${selectedVehicles.length} service requests created.` });
    fetchAll();
    onUpdate();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Service Requests</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent border-0" disabled={vehicles.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Bulk Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Bulk Service Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select Vehicles</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {vehicles.map(v => (
                    <label key={v.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                      <Checkbox checked={selectedVehicles.includes(v.id)} onCheckedChange={() => toggleVehicle(v.id)} />
                      <span className="font-medium">{v.vehicle_name}</span>
                      <span className="text-muted-foreground text-sm">{v.vehicle_number}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{selectedVehicles.length} vehicle(s) selected</p>
              </div>
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={form.service_type_id} onValueChange={(v) => setForm({ ...form, service_type_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Service Address</Label>
                <Input placeholder="Fleet yard / garage address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea placeholder="Additional details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={handleBulkSubmit} disabled={sending} className="w-full gradient-primary">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send {selectedVehicles.length} Request(s)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No service requests yet. Create a bulk request to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.batch_id?.slice(0, 16) || '—'}</TableCell>
                    <TableCell>{r.fleet_vehicles?.vehicle_name || '—'} <span className="text-muted-foreground text-xs">{r.fleet_vehicles?.vehicle_number}</span></TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[r.service_requests?.status || 'pending'] || ''}>
                        {r.service_requests?.status || 'pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.service_requests?.final_cost ? `₹${r.service_requests.final_cost}` : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkRequestsTab;
