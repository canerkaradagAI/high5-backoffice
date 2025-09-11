
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  User,
  Phone,
  Edit,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function TaskDetailModal({ 
  task, 
  isOpen, 
  onClose, 
  onEdit,
  getStatusColor,
  getPriorityColor 
}: TaskDetailModalProps) {
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: tr });
    } catch {
      return '-';
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const dueDate = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let statusText = '';
      let statusColor = '';
      
      if (diffDays < 0) {
        statusText = `${Math.abs(diffDays)} gün gecikme`;
        statusColor = 'text-red-600';
      } else if (diffDays === 0) {
        statusText = 'Bugün';
        statusColor = 'text-orange-600';
      } else if (diffDays === 1) {
        statusText = 'Yarın';
        statusColor = 'text-yellow-600';
      } else {
        statusText = `${diffDays} gün kaldı`;
        statusColor = 'text-green-600';
      }
      
      return (
        <div>
          <div>{format(dueDate, 'dd MMMM yyyy, HH:mm', { locale: tr })}</div>
          <div className={`text-sm font-medium ${statusColor}`}>
            {statusText}
          </div>
        </div>
      );
    } catch {
      return '-';
    }
  };

  const getUserDisplayName = (user: { firstName: string | null; lastName: string | null; email: string }) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || user.email;
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{task.title}</DialogTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={`${getStatusColor(task.status)}`}>
                  {task.status}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
                <Badge variant="outline">
                  {task.type}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              className="ml-4"
            >
              <Edit className="w-4 h-4 mr-1" />
              Düzenle
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            {task.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Açıklama</span>
                </div>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {task.description}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Bitiş Tarihi</span>
                </div>
                <div className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {formatDueDate(task.dueDate)}
                </div>
              </div>

              {task.completedAt && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">Tamamlanma Tarihi</span>
                  </div>
                  <div className="text-gray-600 bg-green-50 p-3 rounded-lg">
                    {formatDate(task.completedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* People */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {task.assignedTo && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-700">Atanan Kişi</span>
                  </div>
                  <div className="text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <div>{getUserDisplayName(task.assignedTo)}</div>
                    <div className="text-sm text-gray-500">{task.assignedTo.email}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Oluşturan</span>
                </div>
                <div className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {getUserDisplayName({
                    firstName: task.createdBy.firstName,
                    lastName: task.createdBy.lastName,
                    email: ''
                  })}
                </div>
              </div>
            </div>

            {/* Customer */}
            {task.customer && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-700">Müşteri</span>
                </div>
                <div className="text-gray-600 bg-purple-50 p-3 rounded-lg">
                  <div className="font-medium">{task.customer.fullName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {task.customer.phone}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {task.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Notlar</span>
                </div>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {task.notes}
                </p>
              </div>
            )}

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Oluşturulma Tarihi</span>
                </div>
                <div>{formatDate(task.createdAt)}</div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>Son Güncelleme</span>
                </div>
                <div>{formatDate(task.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
