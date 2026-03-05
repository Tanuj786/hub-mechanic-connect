import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Truck, Pencil, Trash2, Loader2 } from 'lucide-react';

interface Props {
  corporateId: string;
  onUpdate: () => void;
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'electric', label: 'Electric' },
  { value: 'general', label: 'General' },
] as const;

const FleetVehiclesTab = ({ corporateId, onUpdate }: Props) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ vehicle_name: '', vehicle_number: '', vehicle_type: 'car' as string, driver_name: '', driver_phone: '' });
  const { toast } = useToast();

  useEffect(() => { fetchVehicles(); }, [corporateId]);

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('corporate_id', corporateId)
      .order('created_at', { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ vehicle_name: '', vehicle_number: '', vehicle_type: 'car', driver_name: '', driver_phone: '' });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.vehicle_name || !form.vehicle_number) {
      toast({ title: 'Error', description: 'Vehicle name and number are required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('fleet_vehicles').update({
        vehicle_name: form.vehicle_name,
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type as any,
        driver_name: form.driver_name || null,
        driver_phone: form.driver_phone || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Vehicle Updated' });
    } else {
      const { error } = await supabase.from('fleet_vehicles').insert({
        corporate_id: corporateId,
        vehicle_name: form.vehicle_name,
        vehicle_number: form.vehicle_number,
        vehicle_type: form.vehicle_type as any,
        driver_name: form.driver_name || null,
        driver_phone: form.driver_phone || null,
      });
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Vehicle Added' });
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    fetchVehicles();
    onUpdate();
  };

  const handleEdit = (v: any) => {
    setForm({ vehicle_name: v.vehicle_name, vehicle_number: v.vehicle_number, vehicle_type: v.vehicle_type, driver_name: v.driver_name || '', driver_phone: v.driver_phone || '' });
    setEditingId(v.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('fleet_vehicles').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Vehicle Removed' }); fetchVehicles(); onUpdate(); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Fleet Vehicles ({vehicles.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-accent border-0"><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Vehicle Name</Label>
                <Input placeholder="e.g. Delivery Van #12" value={form.vehicle_name} onChange={(e) => setForm({ ...form, vehicle_name: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input placeholder="e.g. MH 01 AB 1234" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Driver Name (optional)</Label>
                <Input placeholder="Driver name" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className="input-field" />
              </div>
              <div className="space-y-2">
                <Label>Driver Phone (optional)</Label>
                <Input placeholder="Driver phone" value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} className="input-field" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update Vehicle' : 'Add Vehicle'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No vehicles added yet. Add your first fleet vehicle to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.vehicle_name}</TableCell>
                    <TableCell>{v.vehicle_number}</TableCell>
                    <TableCell><Badge variant="secondary">{v.vehicle_type}</Badge></TableCell>
                    <TableCell>{v.driver_name || '—'}</TableCell>
                    <TableCell>{v.total_services}</TableCell>
                    <TableCell>
                      <Badge variant={v.is_active ? 'default' : 'secondary'}>{v.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
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

export default FleetVehiclesTab;
