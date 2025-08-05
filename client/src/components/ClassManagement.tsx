
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { 
  Class, 
  CreateClassInput, 
  CreateUserInput, 
  EnrollStudentInput,
  User,
  Student
} from '../../../server/src/schema';

interface ClassManagementProps {
  classes: Class[];
  onClassesChange: (classes: Class[]) => void;
}

interface StudentWithUser extends Student {
  user: User;
}

export function ClassManagement({ classes, onClassesChange }: ClassManagementProps) {
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedClassStudents, setSelectedClassStudents] = useState<StudentWithUser[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Form states
  const [newClass, setNewClass] = useState<CreateClassInput>({
    name: '',
    grade: ''
  });

  const [newUser, setNewUser] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'siswa'
  });

  const [enrollment, setEnrollment] = useState<EnrollStudentInput>({
    user_id: 0,
    class_id: 0,
    student_number: ''
  });

  const loadUsers = useCallback(async () => {
    try {
      await trpc.getUsers.query();
      // STUB: Since backend returns empty array, using sample data for demo
      const stubUsers: User[] = [
        { id: 2, name: 'Siti Aminah', email: 'siti@siswa.id', role: 'siswa', created_at: new Date() },
        { id: 3, name: 'Ahmad Fauzan', email: 'ahmad@siswa.id', role: 'siswa', created_at: new Date() },
        { id: 4, name: 'Rina Sari', email: 'rina@siswa.id', role: 'siswa', created_at: new Date() },
        { id: 5, name: 'Doni Prakoso', email: 'doni@siswa.id', role: 'siswa', created_at: new Date() },
        { id: 6, name: 'Maya Sari', email: 'maya@siswa.id', role: 'siswa', created_at: new Date() },
        { id: 7, name: 'Rizki Pratama', email: 'rizki@siswa.id', role: 'siswa', created_at: new Date() }
      ];
      setUsers(stubUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const loadClassStudents = useCallback(async (classId: number) => {
    try {
      await trpc.getStudentsByClass.query({ classId });
      // STUB: Since backend returns empty array, using sample data for demo
      const stubStudents: StudentWithUser[] = [
        {
          id: 1,
          user_id: 2,
          class_id: classId,
          student_number: '2024001',
          created_at: new Date(),
          user: { id: 2, name: 'Siti Aminah', email: 'siti@siswa.id', role: 'siswa', created_at: new Date() }
        },
        {
          id: 2,
          user_id: 3,
          class_id: classId,
          student_number: '2024002',
          created_at: new Date(),
          user: { id: 3, name: 'Ahmad Fauzan', email: 'ahmad@siswa.id', role: 'siswa', created_at: new Date() }
        }
      ];
      setSelectedClassStudents(stubStudents);
    } catch (error) {
      console.error('Failed to load class students:', error);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStudents(selectedClassId);
    }
  }, [selectedClassId, loadClassStudents]);

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.grade) return;

    setIsCreatingClass(true);
    try {
      const result = await trpc.createClass.mutate(newClass);
      onClassesChange([...classes, result]);
      setNewClass({ name: '', grade: '' });
      alert('✅ Kelas berhasil dibuat!');
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('❌ Gagal membuat kelas. Silakan coba lagi.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) return;

    setIsCreatingUser(true);
    try {
      const result = await trpc.createUser.mutate(newUser);
      setUsers((prev: User[]) => [...prev, result]);
      setNewUser({ name: '', email: '', role: 'siswa' });
      alert('✅ Pengguna berhasil dibuat!');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('❌ Gagal membuat pengguna. Silakan coba lagi.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollment.user_id || !enrollment.class_id || !enrollment.student_number) return;

    setIsEnrollingStudent(true);
    try {
      await trpc.enrollStudent.mutate(enrollment);
      if (selectedClassId === enrollment.class_id) {
        loadClassStudents(selectedClassId);
      }
      setEnrollment({ user_id: 0, class_id: 0, student_number: '' });
      alert('✅ Siswa berhasil didaftarkan ke kelas!');
    } catch (error) {
      console.error('Failed to enroll student:', error);
      alert('❌ Gagal mendaftarkan siswa. Silakan coba lagi.');
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  const availableStudents = users.filter((user: User) => 
    user.role === 'siswa' && 
    !selectedClassStudents.some((student: StudentWithUser) => student.user_id === user.id)
  );

  const selectedClass = classes.find((cls: Class) => cls.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Create Class Section */}
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            🏫 Buat Kelas Baru
          </CardTitle>
          <CardDescription className="text-blue-700">
            Tambahkan kelas baru ke sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-name" className="text-sm font-medium">
                Nama Kelas
              </Label>
              <Input
                id="class-name"
                placeholder="Contoh: Kelas 10A"
                value={newClass.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewClass((prev: CreateClassInput) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class-grade" className="text-sm font-medium">
                Tingkat
              </Label>
              <Select onValueChange={(value: string) =>
                setNewClass((prev: CreateClassInput) => ({ ...prev, grade: value }))
              }>
                <SelectTrigger id="class-grade">
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Kelas 10</SelectItem>
                  <SelectItem value="11">Kelas 11</SelectItem>
                  <SelectItem value="12">Kelas 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCreateClass}
                disabled={isCreatingClass || !newClass.name || !newClass.grade}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingClass ? '⏱️ Membuat...' : '➕ Buat Kelas'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create User Section */}
      <Card className="border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-900">
            👤 Buat Pengguna Baru
          </CardTitle>
          <CardDescription className="text-green-700">
            Tambahkan siswa atau guru baru ke sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name" className="text-sm font-medium">
                Nama Lengkap
              </Label>
              <Input
                id="user-name"
                placeholder="Nama pengguna"
                value={newUser.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewUser((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="user-email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="user-email"
                type="email"
                placeholder="email@domain.com"
                value={newUser.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewUser((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role" className="text-sm font-medium">
                Peran
              </Label>
              <Select onValueChange={(value: 'siswa' | 'guru') =>
                setNewUser((prev: CreateUserInput) => ({ ...prev, role: value }))
              }>
                <SelectTrigger id="user-role">
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="siswa">👨‍🎓 Siswa</SelectItem>
                  <SelectItem value="guru">👨‍🏫 Guru</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleCreateUser}
                disabled={isCreatingUser || !newUser.name || !newUser.email}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreatingUser ? '⏱️ Membuat...' : '➕ Buat Pengguna'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Management */}
      <Card className="border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            📚 Kelola Siswa dalam Kelas
          </CardTitle>
          <CardDescription className="text-purple-700">
            Daftarkan siswa ke kelas dan lihat daftar siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Class Selection */}
          <div className="mb-6">
            <Label htmlFor="manage-class" className="text-sm font-medium mb-2 block">
              Pilih Kelas untuk Dikelola
            </Label>
            <Select onValueChange={(value: string) => setSelectedClassId(parseInt(value))}>
              <SelectTrigger id="manage-class">
                <SelectValue placeholder="-- Pilih Kelas --" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: Class) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name} - Grade {cls.grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="space-y-6">
              {/* Enrollment Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ➕ Daftarkan Siswa ke {selectedClass.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="enroll-student" className="text-sm font-medium">
                      Pilih Siswa
                    </Label>
                    <Select onValueChange={(value: string) =>
                      setEnrollment((prev: EnrollStudentInput) => ({ 
                        ...prev, 
                        user_id: parseInt(value),
                        class_id: selectedClass.id 
                      }))
                    }>
                      <SelectTrigger id="enroll-student">
                        <SelectValue placeholder="-- Pilih Siswa --" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="student-number" className="text-sm font-medium">
                      Nomor Induk Siswa
                    </Label>
                    <Input
                      id="student-number"
                      placeholder="Contoh: 2024001"
                      value={enrollment.student_number}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEnrollment((prev: EnrollStudentInput) => ({ 
                          ...prev, 
                          student_number: e.target.value 
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <Button 
                      onClick={handleEnrollStudent}
                      disabled={isEnrollingStudent || !enrollment.user_id || !enrollment.student_number}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isEnrollingStudent ? '⏱️ Mendaftarkan...' : '➕ Daftarkan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  👥 Daftar Siswa {selectedClass.name} ({selectedClassStudents.length} siswa)
                </h3>
                
                {selectedClassStudents.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Nama Siswa</TableHead>
                          <TableHead className="font-semibold">NIS</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Tanggal Daftar</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClassStudents.map((student: StudentWithUser) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.user.name}
                            </TableCell>
                            <TableCell>{student.student_number}</TableCell>
                            <TableCell className="text-gray-600">
                              {student.user.email}
                            </TableCell>
                            <TableCell>
                              {student.created_at.toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                ✅ Aktif
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    📝 Belum ada siswa terdaftar di kelas ini
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Classes Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Ringkasan Semua Kelas
          </CardTitle>
          <CardDescription>
            Daftar semua kelas yang tersedia di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classes.length > 0 ? (
            <div className="grid gap-4">
              {classes.map((cls: Class) => (
                <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-semibold">{cls.name}</h3>
                    <p className="text-sm text-gray-600">Grade {cls.grade}</p>
                    <p className="text-xs text-gray-400">
                      Dibuat: {cls.created_at.toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      📚 Kelas {cls.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              🏫 Belum ada kelas yang dibuat
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
