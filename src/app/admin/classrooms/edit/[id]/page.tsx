"use client";

import CreateEditClassroom from '../../create/page';
import { useParams } from 'next/navigation';

export default function EditClassroomPage() {
  const params = useParams();
  return <CreateEditClassroom params={params} />;
}
