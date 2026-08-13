export interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  work_item_id: number | null
  is_read: boolean
  created_at: string
}
