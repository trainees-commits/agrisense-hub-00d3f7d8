import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, User, Mail, Phone } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};
  const [fullName, setFullName] = useState<string>(meta.full_name || '');
  const [phone, setPhone] = useState<string>(meta.phone || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) { toast.error('Informe o nome'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), phone: phone.trim() },
      ...(email.trim() !== user?.email ? { email: email.trim() } : {}),
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (email.trim() !== user?.email) {
      toast.success('Perfil atualizado. Verifique o novo email para confirmar.');
    } else {
      toast.success('Perfil atualizado com sucesso');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Perfil do Utilizador</h2>
        <p className="text-sm text-muted-foreground">Gerir os seus dados pessoais</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4" /> Dados Pessoais
          </CardTitle>
          <CardDescription className="text-xs">Estes dados ficam associados à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{fullName || 'Sem nome'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Nome completo</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+244 ..." />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Guardar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
