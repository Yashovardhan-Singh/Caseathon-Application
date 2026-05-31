import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SBASE_URL!, 
    process.env.NEXT_PUBLIC_SBASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.pathname;

  // 1. Not Logged In -> Trying to access Protected Routes
  if (!user && (url.startsWith('/admin') || url.startsWith('/operations') || url.startsWith('/store/order') || url.startsWith('/store/user-profile'))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // 2. Fetch Role ONLY if hitting protected areas or auth pages (saves DB reads on public store pages)
  let userRole = null;
  if (user && (url.startsWith('/admin') || url.startsWith('/operations') || url === '/login' || url === '/sign-up')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    userRole = profile?.role;
  }

  // 3. RBAC: Admin Routes
  if (user && url.startsWith('/admin') && userRole !== 'Admin') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/store'
    return NextResponse.redirect(redirectUrl)
  }

  // 4. RBAC: Operations Routes
  if (user && url.startsWith('/operations')) {
    // Admins have master access, let them through
    if (userRole === 'Admin') {
      // Pass
    } 
    // Fishermen can only access landings
    else if (url.startsWith('/operations/landings') && userRole !== 'Fisherman') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/store'
      return NextResponse.redirect(redirectUrl)
    } 
    // Drivers can only access logistics
    else if (url.startsWith('/operations/logistics') && userRole !== 'Driver') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/store'
      return NextResponse.redirect(redirectUrl)
    }
    // Block anyone else (like Customers) trying to access /operations
    else if (userRole !== 'Fisherman' && userRole !== 'Driver' && userRole !== 'Admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/store'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // 5. Smart Auth Redirects: Send logged-in users to their specific dashboards
  if (user && (url === '/login' || url === '/sign-up')) {
    const redirectUrl = request.nextUrl.clone()
    
    if (userRole === 'Admin') redirectUrl.pathname = '/admin/metrics'
    else if (userRole === 'Fisherman') redirectUrl.pathname = '/operations/landings'
    else if (userRole === 'Driver') redirectUrl.pathname = '/operations/logistics'
    else redirectUrl.pathname = '/store' // Customers default to store
    
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}