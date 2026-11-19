import { request } from '../../shared/api/http'
import type { Paginated, Program } from '../console/api'

export const homeApi = {
  programs: (token: string) => request<Paginated<Program>>('/programs?pageSize=100', { token }),
}
