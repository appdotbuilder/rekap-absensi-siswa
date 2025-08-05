
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { AttendanceForm } from '@/components/AttendanceForm';
import { AttendanceStats } from '@/components/AttendanceStats';
import { AttendanceReport } from '@/components/AttendanceReport';
import { ClassManagement } from '@/components/ClassManagement';
// Using type-only imports for better TypeScript compliance
import type { Class, AttendanceStats as AttendanceStatsType, User } from '../../server/src/schema';

function App() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentUser] = useState<User>({
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@sekolah.id',
    role: 'siswa',
    created_at: new Date()
  }); // STUB: In real app, this would come from authentication
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatsType>({
    total_students: 0,
    present_today: 0,
    sick_today: 0,
    excused_today: 0,
    absent_today: 0,
    attendance_rate: 0
  });

  const loadClasses = useCallback(async () => {
    try {
      await trpc.getClasses.query();
      // STUB: Since backend returns empty array, using sample data for demo
      const stubClasses: Class[] = [
        { id: 1, name: 'Kelas 10A', grade: '10', created_at: new Date() },
        { id: 2, name: 'Kelas 10B', grade: '10', created_at: new Date() },
        { id: 3, name: 'Kelas 11A', grade: '11', created_at: new Date() }
      ];
      setClasses(stubClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  }, []);

  const loadAttendanceStats = useCallback(async () => {
    try {
      await trpc.getAttendanceStats.query({});
      // STUB: Since backend returns zeros, using sample data for demo
      const stubStats: AttendanceStatsType = {
        total_students: 120,
        present_today: 95,
        sick_today: 8,
        excused_today: 5,
        absent_today: 12,
        attendance_rate: 79.2
      };
      setAttendanceStats(stubStats);
    } catch (error) {
      console.error('Failed to load attendance stats:', error);
    }
  }, []);

  useEffect(() => {
    loadClasses();
    loadAttendanceStats();
  }, [loadClasses, loadAttendanceStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-800';
      case 'Sakit': return 'bg-yellow-100 text-yellow-800';
      case 'Izin': return 'bg-blue-100 text-blue-800';
      case 'Alfa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Sistem Absensi Sekolah
          </h1>
          <p className="text-gray-600">
            Selamat datang, <span className="font-semibold">{currentUser.name}</span> 
            <Badge variant="secondary" className="ml-2 capitalize">
              {currentUser.role}
            </Badge>
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceStats.total_students}</p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hadir Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present_today}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tidak Hadir</p>
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceStats.sick_today + attendanceStats.excused_today + attendanceStats.absent_today}
                  </p>
                </div>
                <div className="text-3xl">❌</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tingkat Kehadiran</p>
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.attendance_rate}%</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={currentUser.role === 'siswa' ? 'attendance' : 'dashboard'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            {currentUser.role === 'siswa' && (
              <TabsTrigger value="attendance" className="text-sm font-medium">
                📝 Isi Absensi
              </TabsTrigger>
            )}
            <TabsTrigger value="dashboard" className="text-sm font-medium">
              📊 Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-sm font-medium">
              📋 Laporan
            </TabsTrigger>
            {currentUser.role === 'guru' && (
              <TabsTrigger value="management" className="text-sm font-medium">
                ⚙️ Kelola Kelas
              </TabsTrigger>
            )}
          </TabsList>

          {/* Student Attendance Form */}
          {currentUser.role === 'siswa' && (
            <TabsContent value="attendance" className="space-y-6">
              <Card className="bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    📝 Form Absensi Siswa
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Pilih kelas dan isi status kehadiran untuk siswa lain
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <AttendanceForm 
                    classes={classes} 
                    currentUser={currentUser}
                    getStatusColor={getStatusColor}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  📊 Dashboard Kehadiran
                </CardTitle>
                <CardDescription className="text-green-100">
                  Statistik dan ringkasan kehadiran siswa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AttendanceStats 
                  stats={attendanceStats} 
                  classes={classes}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  📋 Laporan Kehadiran
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Laporan detail kehadiran siswa per kelas dan periode
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AttendanceReport 
                  classes={classes}
                  getStatusColor={getStatusColor}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Class Management (Teachers only) */}
          {currentUser.role === 'guru' && (
            <TabsContent value="management" className="space-y-6">
              <Card className="bg-white shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    ⚙️ Kelola Kelas & Siswa
                  </CardTitle>
                  <CardDescription className="text-orange-100">
                    Tambah kelas baru dan kelola pendaftaran siswa
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ClassManagement classes={classes} onClassesChange={setClasses} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
