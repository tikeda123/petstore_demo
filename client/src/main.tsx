import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { fetcher } from "./lib/fetcher";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import PetDetails from "./pages/PetDetails";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import Admin from "./pages/Admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig value={{ fetcher }}>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/pets/:id" component={PetDetails} />
          <Route path="/cart" component={Cart} />
          <Route path="/account" component={Account} />
          <Route path="/admin" component={Admin} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </Layout>
      <Toaster />
    </SWRConfig>
  </StrictMode>
);
