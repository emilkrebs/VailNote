export default function Navbar() {
    return (
        <nav class='relative z-20 max-w-6xl mx-auto px-4 py-6'>
            <div class='flex justify-end items-center'>
                <div class='flex items-center space-x-6'>
                    <a href='/vault' class='text-white hover:text-blue-300 transition-colors font-medium'>
                        Vault
                    </a>
                    <a href='/blog' class='text-white hover:text-blue-300 transition-colors font-medium'>
                        Blog
                    </a>
                    <a href='/privacy' class='text-white hover:text-blue-300 transition-colors font-medium'>
                        Privacy
                    </a>
                    <a href='/terms' class='text-white hover:text-blue-300 transition-colors font-medium'>
                        Terms
                    </a>
                </div>
            </div>
        </nav>
    );
}
