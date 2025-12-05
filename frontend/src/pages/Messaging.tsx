import { AppLayout } from "@/components/layout/AppLayout";
import { MessagingInterface } from "@/components/messaging/MessagingInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Messaging = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Messagerie</h1>
        </div>

        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <MessagingInterface />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Messaging;