'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FeedRulesConfig, FilterRule } from '@/lib/api/feedRules';
import ConditionBuilder from './ConditionBuilder';

interface FilterRulesTableProps {
  rules: FeedRulesConfig;
  setRules: (rules: FeedRulesConfig) => void;
}

interface SortableRowProps {
  filter: FilterRule;
  index: number;
  isEditing: boolean;
  editData: Partial<FilterRule>;
  onEdit: (index: number) => void;
  onSave: (index: number) => void;
  onCancel: () => void;
  onDelete: (index: number) => void;
  onUpdate: (field: keyof FilterRule, value: any) => void;
}

function SortableRow({ filter, index, isEditing, editData, onEdit, onSave, onCancel, onDelete, onUpdate }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filter.name + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isEditing ? 'bg-blue-50' : ''}>
      <TableCell className="w-12">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
      </TableCell>
      <TableCell className="w-16 text-center">{index + 1}</TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editData.name || ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="Filter name"
            className="h-8"
          />
        ) : (
          <span className="font-medium">{filter.name}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Input
            value={editData.slug || ''}
            onChange={(e) => onUpdate('slug', e.target.value)}
            placeholder="Optional slug"
            className="h-8"
          />
        ) : (
          <span className="text-slate-600">{filter.slug || '-'}</span>
        )}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <Select
            value={editData.action || 'include'}
            onValueChange={(value) => onUpdate('action', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Include</SelectItem>
              <SelectItem value="exclude">Exclude</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant={filter.action === 'exclude' ? 'destructive' : 'default'}>
            {filter.action || 'include'}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {filter.conditions?.length || 0} condition{filter.conditions?.length !== 1 ? 's' : ''}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onSave(index)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                onClick={onCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(index)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function FilterRulesTable({ rules, setRules }: FilterRulesTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<FilterRule>>({});
  const [showConditionBuilder, setShowConditionBuilder] = useState(false);

  const filters = rules.filters || [];

  const handleAdd = () => {
    const newFilter: FilterRule = {
      name: `Filter ${filters.length + 1}`,
      slug: '',
      action: 'include',
      conditions: [],
    };

    setRules({
      ...rules,
      filters: [...filters, newFilter],
    });

    // Start editing the new filter
    setEditingIndex(filters.length);
    setEditData(newFilter);
    setShowConditionBuilder(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...filters[index] });
    setShowConditionBuilder(true);
  };

  const handleSave = (index: number) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], ...editData };

    setRules({
      ...rules,
      filters: updatedFilters,
    });

    setEditingIndex(null);
    setEditData({});
    setShowConditionBuilder(false);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData({});
    setShowConditionBuilder(false);
  };

  const handleDelete = (index: number) => {
    if (confirm('Are you sure you want to delete this filter?')) {
      const updatedFilters = filters.filter((_, i) => i !== index);
      setRules({
        ...rules,
        filters: updatedFilters,
      });
    }
  };

  const handleUpdate = (field: keyof FilterRule, value: any) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filters.findIndex((f, i) => f.name + i === active.id);
      const newIndex = filters.findIndex((f, i) => f.name + i === over.id);

      const newFilters = [...filters];
      const [removed] = newFilters.splice(oldIndex, 1);
      newFilters.splice(newIndex, 0, removed);

      setRules({
        ...rules,
        filters: newFilters,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-600">
          {filters.length} filter{filters.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>No filters configured</p>
          <p className="text-sm mt-2">Click "Add Filter" to create your first filter rule</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={filters.map((f, i) => f.name + i)}
                  strategy={verticalListSortingStrategy}
                >
                  {filters.map((filter, index) => (
                    <SortableRow
                      key={filter.name + index}
                      filter={filter}
                      index={index}
                      isEditing={editingIndex === index}
                      editData={editData}
                      onEdit={handleEdit}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {/* Condition Builder Modal/Panel */}
      {showConditionBuilder && editingIndex !== null && (
        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">Edit Conditions</h4>
            <Button
              onClick={() => setShowConditionBuilder(false)}
              variant="ghost"
              size="sm"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <ConditionBuilder
            conditions={editData.conditions || []}
            onChange={(conditions) => setEditData({ ...editData, conditions })}
            allowedOperators={['equals', 'contains', 'in', 'regex', 'gt', 'gte', 'lt', 'lte']}
          />
        </div>
      )}
    </div>
  );
}

