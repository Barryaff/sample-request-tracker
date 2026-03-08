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
import { FlaskConical } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Gradient background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F37021] via-[#E85D04] to-[#D45A00]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.1),transparent_50%)]" />

      {/* Decorative shapes */}
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 size-[500px] rounded-full bg-black/5 blur-3xl" />

      {/* Floating geometric accents */}
      <div className="absolute top-[15%] left-[10%] size-3 rotate-45 rounded-sm bg-white/20" />
      <div className="absolute bottom-[20%] right-[15%] size-4 rounded-full bg-white/10" />
      <div className="absolute top-[60%] left-[80%] size-2 rotate-12 rounded-sm bg-white/15" />
      <div className="absolute top-[30%] right-[25%] size-2 rounded-full bg-white/10" />

      {/* Card */}
      <Card className="relative z-10 w-full max-w-[400px] border-none bg-white/95 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F37021] to-[#D45A00] shadow-lg shadow-orange-500/30">
            <FlaskConical className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Sample Request Tracker
          </CardTitle>
          <CardDescription className="text-[13px]">
            Advanced Flavors & Fragrances
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/my-actions" });
            }}
          >
            <Button
              type="submit"
              className="h-11 w-full text-[13px] font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
              size="lg"
            >
              Sign in with Google
            </Button>
          </form>

          {process.env.NODE_ENV === "development" && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  Dev Login
                </span>
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
                  <Label htmlFor="email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="admin@test.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    defaultValue="Test Admin"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full text-[13px]"
                >
                  Dev Sign In
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bottom attribution */}
      <p className="absolute bottom-6 text-xs font-medium text-white/50">
        AFF Internal Platform
      </p>
    </div>
  );
}
