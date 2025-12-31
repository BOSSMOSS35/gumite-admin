import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Store,
  Bell,
  Shield,
  CreditCard,
  Upload,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and store preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                  <AvatarFallback className="text-lg">AD</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@gumite.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Details</CardTitle>
              <CardDescription>
                Configure your store information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" defaultValue="Gumite" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeUrl">Store URL</Label>
                  <Input id="storeUrl" defaultValue="gumite.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (&euro;)</SelectItem>
                      <SelectItem value="gbp">GBP (&pound;)</SelectItem>
                      <SelectItem value="jpy">JPY (&yen;)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="america_new_york">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america_new_york">Eastern Time (ET)</SelectItem>
                      <SelectItem value="america_los_angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="europe_london">London (GMT)</SelectItem>
                      <SelectItem value="asia_tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  defaultValue="Gumite is a luxury fashion resale platform offering authenticated pre-owned designer items."
                  className="min-h-[100px]"
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Business Address</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" defaultValue="123 Fashion Ave" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" defaultValue="NY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" defaultValue="10001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select defaultValue="us">
                      <SelectTrigger id="country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Orders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email for new orders
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when order status changes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Alert when product stock is low
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Customer Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when customers send messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Push Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show desktop notifications
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound for notifications
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="flex justify-end">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Require verification code on login
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you&apos;re signed in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium">MacBook Pro - Chrome</p>
                  <p className="text-sm text-muted-foreground">
                    New York, US • Current session
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium">iPhone 15 - Safari</p>
                  <p className="text-sm text-muted-foreground">
                    New York, US • 2 hours ago
                  </p>
                </div>
                <Button variant="outline" size="sm">Revoke</Button>
              </div>
              <Button variant="destructive" className="w-full">
                Sign out all other sessions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Manage your payment methods for payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/26</p>
                  </div>
                </div>
                <Badge>Default</Badge>
              </div>
              <Button variant="outline" className="w-full">
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
