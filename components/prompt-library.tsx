"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Copy, Edit, MoreHorizontal, Play, Search, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import apiClient, { Prompt } from "@/lib/api"

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  // Load prompts on component mount
  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (searchQuery) {
        params.search = searchQuery
      }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }

      const response = await apiClient.getPrompts(params)
      setPrompts(response.prompts)
    } catch (error) {
      console.error("Error loading prompts:", error)
      toast({
        title: "Error",
        description: "Failed to load prompts. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Reload prompts when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPrompts()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter])

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    setEditDialogOpen(true)
  }

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return

    try {
      setUpdating(true)
      await apiClient.updatePrompt(selectedPrompt.id, {
        name: selectedPrompt.name,
        category: selectedPrompt.category,
        status: selectedPrompt.status,
        content: selectedPrompt.content,
        description: selectedPrompt.description,
      })

      toast({
        title: "Success",
        description: "Prompt updated successfully.",
      })

      setEditDialogOpen(false)
      loadPrompts() // Reload the list
    } catch (error) {
      console.error("Error updating prompt:", error)
      toast({
        title: "Error",
        description: "Failed to update prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return

    try {
      await apiClient.deletePrompt(promptId)
      toast({
        title: "Success",
        description: "Prompt deleted successfully.",
      })
      loadPrompts() // Reload the list
    } catch (error) {
      console.error("Error deleting prompt:", error)
      toast({
        title: "Error",
        description: "Failed to delete prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicatePrompt = async (promptId: string) => {
    try {
      await apiClient.duplicatePrompt(promptId)
      toast({
        title: "Success",
        description: "Prompt duplicated successfully.",
      })
      loadPrompts() // Reload the list
    } catch (error) {
      console.error("Error duplicating prompt:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleActivatePrompt = async (promptId: string) => {
    try {
      await apiClient.activatePrompt(promptId)
      toast({
        title: "Success",
        description: "Prompt activated successfully.",
      })
      loadPrompts() // Reload the list
    } catch (error) {
      console.error("Error activating prompt:", error)
      toast({
        title: "Error",
        description: "Failed to activate prompt. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredPrompts = prompts.filter(
    (prompt) =>
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading prompts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search prompts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPrompts.map((prompt) => (
            <TableRow key={prompt.id}>
              <TableCell className="font-medium">{prompt.name}</TableCell>
              <TableCell>{prompt.category}</TableCell>
              <TableCell>
                <Badge variant="outline">{prompt.carrier}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={prompt.accuracy >= 90 ? "default" : prompt.accuracy >= 80 ? "secondary" : "destructive"}
                  className={prompt.accuracy >= 90 ? "bg-emerald-500" : prompt.accuracy >= 80 ? "bg-amber-500" : ""}
                >
                  {prompt.accuracy}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={prompt.status === "active" ? "outline" : "secondary"}
                  className={
                    prompt.status === "active"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-slate-500 text-slate-500"
                  }
                >
                  {prompt.status}
                </Badge>
              </TableCell>
              <TableCell>{prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEditPrompt(prompt)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicatePrompt(prompt.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    {prompt.status === "inactive" && (
                      <DropdownMenuItem onClick={() => handleActivatePrompt(prompt.id)}>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {!prompt.is_default && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeletePrompt(prompt.id)}
                      >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredPrompts.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No prompts found. Try adjusting your search or filters.
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>Make changes to the prompt. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {selectedPrompt && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input 
                  id="name" 
                  value={selectedPrompt.name} 
                  onChange={(e) => setSelectedPrompt({...selectedPrompt, name: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right">
                  Category
                </label>
                <Select 
                  value={selectedPrompt.category}
                  onValueChange={(value) => setSelectedPrompt({...selectedPrompt, category: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eligible accounts">Eligible accounts</SelectItem>
                    <SelectItem value="Incentive base discounts">Incentive base discounts</SelectItem>
                    <SelectItem value="Tier">Tier</SelectItem>
                    <SelectItem value="Minimums">Minimums</SelectItem>
                    <SelectItem value="Service adjustments">Service adjustments</SelectItem>
                    <SelectItem value="Accessorials">Accessorials</SelectItem>
                    <SelectItem value="ePLD">ePLD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right">
                  Status
                </label>
                <Select 
                  value={selectedPrompt.status}
                  onValueChange={(value) => setSelectedPrompt({...selectedPrompt, status: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="prompt" className="text-right pt-2">
                  Prompt
                </label>
                <Textarea
                  id="prompt"
                  className="col-span-3"
                  rows={8}
                  value={selectedPrompt.content}
                  onChange={(e) => setSelectedPrompt({...selectedPrompt, content: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePrompt} disabled={updating}>
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
