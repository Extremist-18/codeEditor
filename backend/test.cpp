#include <bits/stdc++.h>
using namespace std;
 
#define max(a, b) 		(a < b ? b : a)
#define min(a, b) 		((a > b) ? b : a)
#define MOD    		1000000007 
#define f(a,b,c) 		for (int a = b;  a <  c;  a++)
#define ia(a,b,c) 		for(int i = b; i<c ;i++){ cin>>a[i]; }
#define ll 				long long
#define vi 				vector<int>
#define vll 			vector<long long> 
#define vvi 			vector<vector<int>>
#define vvll 			vector<vector<ll>>
#define pi 				pair<int, int> 
#define pll 			pair<long long, long long> 
#define ff 				first 
#define ss 				second 
#define pb 				push_back 
#define pob 			pop_back
#define sort(x) 		sort(x.begin(),x.end())
#define rev(x) 			reverse(x.begin(),x.end())
 
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
int lcm(int a, int b) { return (a/gcd(a,b))*b; }
ll modInverse(ll a, ll mod){ ll res = 1,p = mod - 2; while (p){ if(p & 1){res = (res * a) % mod;} a = (a * a) % mod; p >>= 1; } return res;}
ll modDivide(ll a, ll b, ll mod){ a = a % mod; ll inv = modInverse(b, mod); return (inv * a) % mod; }
ll binpow(ll a,ll b, ll mod){ ll res=1; while(b>0){ if(b&1){res = (res*a)%mod;} a = (a*a)%mod; b>>=1; } return res; }
 
 
void solve(){
        int n;  cin>>n;
        ll sum=0;
        f(i,0,n){
            int x;  cin>>x;
            sum += x;
        }    
        cout<<sum<<'\n';
    }
int main(){
    std::ios_base::sync_with_stdio(false);	cin.tie(NULL);
    int tt;
    cin>>tt;
    while(tt--){
            solve();
        }
    return 0;
    }