import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const Welcome = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fadeIn, setFadeIn] = useState(false)
  const qrToken = searchParams.get('token') || 'demo'

  useEffect(() => {
    setFadeIn(true)
  }, [])

  const handleContinue = () => {
    navigate(`/nombre?token=${qrToken}`)
  }

//

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md p-8 transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center space-y-6">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PIRU
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            ¡Bienvenido a nuestra mesa! 
          </p>
          

          <div className="pt-6">
            <Button 
              size="lg" 
              className="w-full text-lg h-12"
              onClick={handleContinue}
            >
              Comenzar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Welcome

