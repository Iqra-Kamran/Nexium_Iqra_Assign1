"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Search } from "lucide-react"
import { motion } from "framer-motion"
import quotesData from "../public/quotes.json"

type Quote = {
  id: string
  quote: string
  author: string
  category: string
  explanation: string
}

type QuoteGroup = {
  category: string
  quotes: Array<{
    quote: string
    author?: string
  }>
}

export default function QuoteApp() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [category, setCategory] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quoteOfTheDayIndex] = useState(new Date().getDate() % (quotesData.length || 30))

  useEffect(() => {
    try {
      const formatted = quotesData.flatMap((group: QuoteGroup, i: number) =>
        group.quotes.map((q, j) => ({
          id: `${i}-${j}`,
          quote: q.quote,
          author: q.author || "Unknown",
          category: group.category,
          explanation: `This quote belongs to the ${group.category} category.`
        }))
      )
      setQuotes(formatted)
      if (formatted.length > 0) {
        setCategory(formatted[0].category)
      }
    } catch (err) {
      console.error("Failed to load quotes:", err)
      setError("Failed to load quotes. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredQuotes = useMemo(() => {
    let result = !category ? quotes : quotes.filter((q) => q.category === category)
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(q => 
        q.quote.toLowerCase().includes(query) || 
        q.author.toLowerCase().includes(query) ||
        q.category.toLowerCase().includes(query)
      )
    }
    
    return result
  }, [quotes, category, searchQuery])

  const dailyQuote = useMemo(() => (
    quotes.length > 0 ? quotes[quoteOfTheDayIndex] : null
  ), [quotes, quoteOfTheDayIndex])

  const getSuggestions = useMemo(() => {
    if (!searchQuery) return []
    
    const query = searchQuery.toLowerCase()
    
    const quoteMatches = quotes.filter(q => 
      q.quote.toLowerCase().includes(query) || 
      q.author.toLowerCase().includes(query)
    )
    
    const categoryMatches = Array.from(new Set(
      quotes.filter(q => q.category.toLowerCase().includes(query))
      .map(q => q.category)
    ))
    
    return [
      ...categoryMatches.map(cat => ({ type: "category", value: cat })),
      ...quoteMatches.map(quote => ({ type: "quote", value: quote.quote.substring(0, 50) + "..." }))
    ].slice(0, 5)
  }, [searchQuery, quotes])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images.jpg')" }}>
      <div className="container mx-auto px-4 py-8">
        <TooltipProvider>
          <div className="flex flex-col items-center">
            {/* Large, clear page title */}
            <h1 className="text-6xl font-bold mb-9 text-center">Quote Generator</h1>

            {dailyQuote && (
              <div className="w-full max-w-2xl mb-8">
                {/* Large "Quote of the Day" heading */}
                <h2 className="text-3xl font-bold mb-4 text-left">Quote of the Day</h2>
                {/* Smaller quote container */}
                <Card className="bg-gradient-to-br from-primary to-secondary text-white">
                  <CardContent className="p-4">
                    <blockquote className="text-lg italic">"{dailyQuote.quote}"</blockquote>
                    <p className="mt-2 text-right font-medium">— {dailyQuote.author}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="w-full max-w-2xl mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger className="w-full md:w-64 bg-white/10 text-white border-white/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(quotes.map(q => q.category))).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Prominent search bar with clear text */}
                <div className="relative w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
                    <Input
                      type="search"
                      placeholder="Search quotes..."
                      className="pl-10 bg-lightgrey/10 border-white/20 text-white text-lg placeholder:text-white/70 focus-visible:ring-white/30 h-12"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                  </div>
                  
                  {showSuggestions && searchQuery && getSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 bg-gray-800/90 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg overflow-hidden"
                    >
                      {getSuggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/10 last:border-0"
                          onMouseDown={() => {
                            if (suggestion.type === "category") {
                              setCategory(suggestion.value)
                              setSearchQuery("")
                            }
                            setShowSuggestions(false)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {suggestion.type === "category" ? (
                              <>
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                  Category
                                </span>
                                <span>{suggestion.value}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                  Quote
                                </span>
                                <span className="truncate">{suggestion.value}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {filteredQuotes.length === 0 ? (
              <Card className="w-full max-w-2xl">
                <CardContent className="p-6 text-center">
                  <p>No quotes found matching your search.</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-white"
                    onClick={() => {
                      setSearchQuery("")
                    }}
                  >
                    Clear search
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full max-w-2xl space-y-4">
                {filteredQuotes.map((quote) => (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
                      <CardContent className="p-4 relative">
                        {/* Smaller quote text */}
                        <blockquote className="text-base">"{quote.quote}"</blockquote>
                        <p className="mt-1 text-sm text-white/70">— {quote.author}</p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="absolute top-3 right-3 text-white/50 hover:text-white"
                              aria-label="Quote explanation"
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white text-black max-w-[300px] p-3 border border-white/20 shadow-lg">
                            <p className="font-medium mb-1">About this quote:</p>
                            <p className="text-sm">{quote.explanation}</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}