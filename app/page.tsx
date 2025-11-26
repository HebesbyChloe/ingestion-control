import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Settings, Database, Activity } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Ingestion Control Panel</h1>
          <p className="text-slate-600 mt-2">Manage schedules, rules, and feed ingestion</p>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/schedules" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900">Schedules</CardTitle>
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <CardDescription className="text-slate-500">Manage cron schedules for ingestion</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Create and manage automated ingestion schedules</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/rules" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900">Rules</CardTitle>
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <CardDescription className="text-slate-500">Manage pricing, origin, and scoring rules</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">Configure pricing, origin, and scoring rules</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/feeds" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900">Feeds</CardTitle>
                  <Database className="h-5 w-5 text-purple-600" />
                </div>
                <CardDescription className="text-slate-500">Monitor and trigger feed ingestion</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">View feed status and trigger ingestion manually</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-slate-200 bg-white h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900">Dashboard</CardTitle>
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <CardDescription className="text-slate-500">Overview and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">View system overview and metrics</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
