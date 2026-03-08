import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Sample Request Tracker
          </CardTitle>
          <CardDescription>Internal sample management</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in with Google
            </Button>
          </form>

          {process.env.NODE_ENV === "development" && (
            <>
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">DEV LOGIN</span>
                <Separator className="flex-1" />
              </div>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await signIn("credentials", {
                    email: formData.get("email") as string,
                    name: formData.get("name") as string,
                    redirectTo: "/my-actions",
                  });
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="admin@test.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue="Test Admin"
                    required
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full">
                  Dev Sign In
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
