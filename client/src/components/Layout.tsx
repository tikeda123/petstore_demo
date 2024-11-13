import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="text-2xl font-bold text-primary cursor-pointer">PetShop</span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/cart">
                    <Button variant="ghost">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Cart
                    </Button>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/account">
                    <Button variant="ghost">
                      <User className="mr-2 h-4 w-4" />
                      {user ? user.username : "Account"}
                    </Button>
                  </Link>
                </NavigationMenuItem>
                {user?.isAdmin && (
                  <NavigationMenuItem>
                    <Link href="/admin">
                      <Button variant="ghost">Admin</Button>
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 PetShop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
