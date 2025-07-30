"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ExternalLink, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface Deployment {
  chainId: string
  chainName: string
  contractAddress: string
  contractName: string
  version: string
  deploymentBlock: string
  deploymentTxHash: string
  verified: boolean
  explorerUrl?: string
}

export default function LayerZeroDeployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [filteredDeployments, setFilteredDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChain, setSelectedChain] = useState<string>("all")
  const [selectedContract, setSelectedContract] = useState<string>("all")
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDeployments()
  }, [])

  useEffect(() => {
    filterDeployments()
  }, [deployments, searchTerm, selectedChain, selectedContract])

  const fetchDeployments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/deployments")
      if (!response.ok) {
        throw new Error("Failed to fetch deployments")
      }
      const data = await response.json()

      // Transform the data into a more usable format
      const transformedData: Deployment[] = []

      Object.entries(data).forEach(([chainId, chainData]: [string, any]) => {
        if (chainData && typeof chainData === "object") {
          Object.entries(chainData).forEach(([contractName, contractData]: [string, any]) => {
            if (contractData && typeof contractData === "object") {
              transformedData.push({
                chainId,
                chainName: getChainName(chainId),
                contractAddress: contractData.address || "",
                contractName,
                version: contractData.version || "Unknown",
                deploymentBlock: contractData.deploymentBlock || "",
                deploymentTxHash: contractData.deploymentTxHash || "",
                verified: contractData.verified || false,
                explorerUrl: contractData.explorerUrl,
              })
            }
          })
        }
      })

      setDeployments(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const getChainName = (chainId: string): string => {
    const chainNames: { [key: string]: string } = {
      "1": "Ethereum",
      "137": "Polygon",
      "56": "BSC",
      "43114": "Avalanche",
      "250": "Fantom",
      "42161": "Arbitrum",
      "10": "Optimism",
      "1101": "Polygon zkEVM",
      "8453": "Base",
      "59144": "Linea",
    }
    return chainNames[chainId] || `Chain ${chainId}`
  }

  const filterDeployments = () => {
    let filtered = deployments

    if (searchTerm) {
      filtered = filtered.filter(
        (deployment) =>
          deployment.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deployment.contractAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deployment.chainName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedChain !== "all") {
      filtered = filtered.filter((deployment) => deployment.chainId === selectedChain)
    }

    if (selectedContract !== "all") {
      filtered = filtered.filter((deployment) => deployment.contractName === selectedContract)
    }

    setFilteredDeployments(filtered)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      })
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      })
    }
  }

  const uniqueChains = Array.from(new Set(deployments.map((d) => d.chainId)))
    .map((chainId) => ({ id: chainId, name: getChainName(chainId) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const uniqueContracts = Array.from(new Set(deployments.map((d) => d.contractName))).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-96 mx-auto" />
              <Skeleton className="h-6 w-[600px] mx-auto" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDeployments} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">LayerZero Deployments</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore LayerZero protocol deployments across different blockchain networks
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Total Deployments: {deployments.length}</span>
              <span>•</span>
              <span>Networks: {uniqueChains.length}</span>
              <span>•</span>
              <span>Contracts: {uniqueContracts.length}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by contract name, address, or chain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Chains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                {uniqueChains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Contracts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                {uniqueContracts.map((contract) => (
                  <SelectItem key={contract} value={contract}>
                    {contract}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing {filteredDeployments.length} of {deployments.length} deployments
              </p>
              {(searchTerm || selectedChain !== "all" || selectedContract !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedChain("all")
                    setSelectedContract("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {filteredDeployments.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No deployments found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDeployments.map((deployment, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{deployment.contractName}</CardTitle>
                          <CardDescription>{deployment.chainName}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          {deployment.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            v{deployment.version}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Address:</span>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {deployment.contractAddress.slice(0, 6)}...{deployment.contractAddress.slice(-4)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(deployment.contractAddress)}
                            >
                              {copiedAddress === deployment.contractAddress ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Chain ID:</span>
                          <Badge variant="outline">{deployment.chainId}</Badge>
                        </div>
                        {deployment.deploymentBlock && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Block:</span>
                            <span className="text-sm text-muted-foreground">{deployment.deploymentBlock}</span>
                          </div>
                        )}
                      </div>
                      {deployment.explorerUrl && (
                        <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                          <a
                            href={deployment.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            View on Explorer
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
