import { useState } from "react"
import { 
  Search, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  FileText, 
  Home,
  TrendingUp,
  Users,
  Brain,
  ChevronDown
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navigation = [
  { title: "Dashboard", icon: Home, tab: "dashboard" },
  { title: "Research", icon: Search, tab: "research" },
  { title: "Comparison", icon: BarChart3, tab: "comparison" },
  { title: "AI Assistant", icon: MessageSquare, tab: "assistant" },
  { title: "Reports", icon: FileText, tab: "reports" },
  { title: "Settings", icon: Settings, tab: "settings" },
]

const agentItems = [
  { title: "Sentiment Analysis", icon: Brain },
  { title: "Competitor Tracking", icon: Users },
  { title: "Trend Detection", icon: TrendingUp },
  { title: "Insight Generation", icon: FileText },
]

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar()
  const [agentsOpen, setAgentsOpen] = useState(true)
  const collapsed = state === 'collapsed'

  const getNavClassName = (tab: string) => {
    return activeTab === tab 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
  }

  return (
    <Sidebar variant="sidebar" className={collapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Brain className="h-6 w-6 text-primary" />
          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold text-sidebar-foreground">Market Research</h1>
              <p className="text-xs text-sidebar-foreground/60">AI-Powered Insights</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={getNavClassName(item.tab)}
                  >
                    <button 
                      onClick={() => onTabChange(item.tab)}
                      className="w-full flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent/30 transition-colors flex items-center justify-between w-full">
                  AI Agents
                  <ChevronDown className={`h-4 w-4 transition-transform ${agentsOpen ? 'rotate-180' : ''}`} />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {agentItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30">
                          <item.icon className="h-3 w-3" />
                          <span className="text-xs">{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4 text-center">
          {!collapsed && (
            <p className="text-xs text-sidebar-foreground/50">
              Powered by AI Agents
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}