"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { getCourses } from '@/app/actions/courses';
import { Course } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, BookOpen, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { profile } = useAuth();

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      if (profile?.role === 'student') {
        const { getStudentAccessibleCourses } = await import('@/app/actions/classrooms');
        const data = await getStudentAccessibleCourses(profile.id);
        setCourses(data);
      } else {
        const data = await getCourses();
        setCourses(data);
      }
      setLoading(false);
    };
    if (profile) loadCourses();
  }, [profile]);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <header className="mb-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-headline font-bold text-primary mb-3">Academic Courses</h1>
          <p className="text-muted-foreground text-lg">
            Explore structured learning paths designed to help you master your subjects.
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search for courses..." 
            className="pl-10 h-12 rounded-full border-primary/20 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p>Loading available courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 border-primary/10 flex flex-col h-full overflow-hidden">
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {course.thumbnail ? (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="h-12 w-12 text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-sm">New</Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="group-hover:text-accent transition-colors line-clamp-1">{course.title}</CardTitle>
                    {course.code && (
                      <Badge variant="outline" className="text-[10px] h-5 border-accent text-accent font-bold">
                        {course.code}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Core Module</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Self-paced</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href={`/courses/${course.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {filteredCourses.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <p className="text-xl">No courses found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
