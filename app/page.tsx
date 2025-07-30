"use client"

import {useEffect, useState} from "react"
import {Check, Copy, ExternalLink, Filter, Search} from "lucide-react"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Skeleton} from "@/components/ui/skeleton"
import {useToast} from "@/hooks/use-toast"

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

interface ChainDetails {
    chainType: string
    chainKey: string
    chainStack: string
    chainLayer: string
    nativeCurrency: {
        symbol: string
        cgId: string
        cmcId: number
        decimals: number
    }
    deployments: {
        eid: string
        endpoint: { address: string }
        endpointV2View: { address: string }
        chainKey: string
        stage: string
        relayerV2: { address: string }
        ultraLightNodeV2: { address: string }
        sendUln301: { address: string }
        receiveUln301: { address: string }
        blockedMessageLib: { address: string }
        nonceContract: { address: string }
        version: number
    }
    dvns:  DVNS
    blockExplorers: {url: string}[]
}
interface DVNS { [key:string]: DVN}
interface DVN {
    version: number
    canonicalName: string
    id: string
}
interface DeploymentChain {
    chainKey: string
    chainDetails: ChainDetails
}

interface Deployment2 { [key:string]: DeploymentChain};

export default function LayerZeroDeployments() {
    const [deployments, setDeployments] = useState<Map<string,DeploymentChain>>(new Map())
    const [filteredDeployments, setFilteredDeployments] = useState<Map<string,DeploymentChain>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedChain, setSelectedChain] = useState<string>("all")
    const [chainType, setChainType] = useState<string>("all")
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
    const {toast} = useToast()

    useEffect(() => {
        fetchDeployments()
    }, [])

    useEffect(() => {
        filterDeployments()
    }, [deployments, searchTerm, selectedChain, chainType])

    const fetchDeployments = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/deployments")
            if (!response.ok) {
                throw new Error("Failed to fetch deployments")
            }
            const data :Deployment2 = await response.json();
            const m  = new  Map<string,DeploymentChain> ();
            for (let d in data) {
                m.set(d,data[d])
            }

            // Transform the data into a more usable format
           // const transformedData: Deployment[] = []

            setDeployments(m)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const getChainName = (chainId: string): string => {

        return  `${chainId}`
    }

    const filterDeployments = () => {
        let filtered = [...deployments.entries()]

        if (searchTerm) {
            filtered = filtered.filter(
                ([chain,_deployment]) =>
                    chain.toLowerCase().includes(searchTerm.toLowerCase()) /* ||
                    deployment.chainKey.toLowerCase().includes(searchTerm.toLowerCase()), */
            )
        }

        if (selectedChain !== "all") {
            filtered = filtered.filter(([chain,deployment]) => deployment.chainKey === selectedChain|| chain === selectedChain)
        }
        if (chainType !== "all") {
            filtered = filtered.filter(([chain,_]) => chain .endsWith(chainType))
        }
        console.log("chainType", chainType)

       let filteredMap :Map<string,DeploymentChain> = new Map( filtered)
        setFilteredDeployments(filteredMap)
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

    const uniqueChains = Array.from(new Set( [...deployments].map(( [chain,deployment]) => deployment.chainKey)))
        .map((chainId) => ({id: chainId, name: getChainName(chainId)}))
        .sort((a, b) => a.name.localeCompare(b.name))


    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <Skeleton className="h-12 w-96 mx-auto"/>
                            <Skeleton className="h-6 w-[600px] mx-auto"/>
                        </div>
                        <div className="flex gap-4">
                            <Skeleton className="h-10 flex-1"/>
                            <Skeleton className="h-10 w-48"/>
                            <Skeleton className="h-10 w-48"/>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({length: 6}).map((_, i) => (
                                <Skeleton key={i} className="h-64"/>
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
                            <span>Total Deployments: {deployments.size}</span>
                            <span>•</span>
                            <span>Networks: {uniqueChains.length}</span>

                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                            <Input
                                placeholder="Search by contract name, address, or chain..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedChain} onValueChange={setSelectedChain}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="h-4 w-4 mr-2"/>
                                <SelectValue placeholder="All Chains"/>
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
                        <Select value={chainType} onValueChange={setChainType}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="h-4 w-4 mr-2"/>
                                <SelectValue placeholder="All Types"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mainnet + Testnet</SelectItem>
                                <SelectItem value="mainnet">Mainnet</SelectItem>
                                <SelectItem value="testnet">Testnet</SelectItem>

                            </SelectContent>
                        </Select>

                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground">
                                Showing {filteredDeployments.size} of {deployments.size} deployments
                            </p>
                            {(searchTerm || selectedChain !== "all" || chainType !== "all") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm("")
                                        setSelectedChain("all")
                                        setChainType("all")
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {filteredDeployments.size === 0 ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <div className="text-center space-y-2">
                                        <p className="text-muted-foreground">No deployments found</p>
                                        <p className="text-sm text-muted-foreground">Try adjusting your search or
                                            filters</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...filteredDeployments].map(([chain,deployment], index) => (
                                    <Card key={index} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-lg">{deployment.chainKey}</CardTitle>
                                                    <CardDescription>{deployment.chainKey}</CardDescription>
                                                </div>
                                                <div className="flex gap-1">
                                                    {deployment.chainDetails?.chainLayer && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-xs">
                                                        v{deployment.chainDetails?.chainKey}
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
                                                            TBD
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => copyToClipboard("TBD")}
                                                        >
                                                            {copiedAddress === "TBD" ? (
                                                                <Check className="h-3 w-3 text-green-600"/>
                                                            ) : (
                                                                <Copy className="h-3 w-3"/>
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
                                                        <span
                                                            className="text-sm text-muted-foreground">{deployment.deploymentBlock}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {deployment.explorerUrl && (
                                                <Button variant="outline" size="sm" className="w-full bg-transparent"
                                                        asChild>
                                                    <a
                                                        href={deployment.explorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2"
                                                    >
                                                        View on Explorer
                                                        <ExternalLink className="h-3 w-3"/>
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
